package com.scopeledger.controller;

import com.scopeledger.ScopeLedgerApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Shared change requests and role permissions (no default role header: every call states who it is). */
@SpringBootTest(classes = ScopeLedgerApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ChangeRequestControllerTest {

    private static final String REQUESTS = "/api/v1/projects/1/change-requests";
    private static final String CHANGE = """
            {"targetTaskId":102,"changeDescription":"Switch Email Login to WhatsApp OTP Login",
             "addedHours":12,"addedDays":2,"droppedOptionalTaskIds":[104]}""";

    private static final String PM = "Project Manager";
    private static final String CLIENT = "Client";
    private static final String FINANCE = "Finance Lead";
    private static final String TEAM = "Team Member";

    @Autowired
    private MockMvc mvc;

    @BeforeEach
    void resetSeed() throws Exception {
        mvc.perform(post("/api/v1/demo/reset").header("X-User-Role", PM)).andExpect(status().isOk());
    }

    private ResultActions as(String role, String name, String path, String body) throws Exception {
        var req = post(path).header("X-User-Role", role).header("X-User-Name", name);
        if (body != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(req);
    }

    private long submitAsClient() throws Exception {
        String json = as(CLIENT, "Rahul%20Mehta", REQUESTS, CHANGE)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(json.replaceAll(".*?\"id\":(\\d+).*", "$1"));
    }

    @Test
    void clientRequestIsSharedWithEveryRoleAndCarriesServerEstimate() throws Exception {
        as(CLIENT, "Rahul%20Mehta", REQUESTS, CHANGE)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.requestedBy").value("Rahul Mehta"))
                .andExpect(jsonPath("$.requestedRole").value(CLIENT))
                .andExpect(jsonPath("$.targetTaskTitle").value("Email Login API"))
                .andExpect(jsonPath("$.costDelta").value(19600.00))
                .andExpect(jsonPath("$.daysDelta").value(0))
                .andExpect(jsonPath("$.droppedOptionalTaskIds[0]").value(104));

        // Another person (any role) sees the same pending request; nothing has been applied yet.
        mvc.perform(get(REQUESTS).header("X-User-Role", FINANCE))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
        mvc.perform(get("/api/v1/projects/1/board")).andExpect(jsonPath("$.baselineBudget").value(220000.00));
    }

    @Test
    void financeLeadApprovesAndPlanIsUpdatedOnce() throws Exception {
        long id = submitAsClient();

        as(FINANCE, "Ananya%20Iyer", REQUESTS + "/" + id + "/approve", "{\"note\":\"Within contingency\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.decidedBy").value("Ananya Iyer"))
                .andExpect(jsonPath("$.decidedRole").value(FINANCE))
                .andExpect(jsonPath("$.decisionNote").value("Within contingency"));

        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(jsonPath("$.baselineBudget").value(239600.00))
                .andExpect(jsonPath("$.tasks[3].isActive").value(false));
        mvc.perform(get("/api/v1/projects/1/change-orders")).andExpect(jsonPath("$", hasSize(1)));

        // A second decision on the same request is refused.
        as(PM, "Priya%20Sharma", REQUESTS + "/" + id + "/approve", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("REQUEST_ALREADY_DECIDED"));
    }

    @Test
    void rejectionKeepsThePlanUnchanged() throws Exception {
        long id = submitAsClient();
        as(PM, "Priya%20Sharma", REQUESTS + "/" + id + "/reject", "{\"note\":\"Out of scope for this release\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.decisionNote").value("Out of scope for this release"));
        mvc.perform(get("/api/v1/projects/1/board")).andExpect(jsonPath("$.baselineBudget").value(220000.00));
        mvc.perform(get("/api/v1/projects/1/change-orders")).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void staleRequestFailsSafelyAndStaysPending() throws Exception {
        long first = submitAsClient();
        long second = submitAsClient(); // also drops 104
        as(PM, "Priya%20Sharma", REQUESTS + "/" + first + "/approve", null).andExpect(status().isOk());

        as(PM, "Priya%20Sharma", REQUESTS + "/" + second + "/approve", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_DROP"));
        mvc.perform(get(REQUESTS))
                .andExpect(jsonPath("$[0].id").value(second))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
        mvc.perform(get("/api/v1/projects/1/change-orders")).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void rolesAreEnforcedOnEveryWrite() throws Exception {
        long id = submitAsClient();

        as(CLIENT, "Rahul", REQUESTS + "/" + id + "/approve", null)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ROLE_NOT_ALLOWED"));
        as(FINANCE, "Ananya", REQUESTS, CHANGE).andExpect(status().isForbidden());
        as(CLIENT, "Rahul", "/api/v1/projects/1/change-orders/commit", CHANGE).andExpect(status().isForbidden());
        as(FINANCE, "Ananya", "/api/v1/projects/1/tasks", "{\"title\":\"x\",\"estimatedHours\":1,\"hourlyRate\":1,\"durationDays\":1}")
                .andExpect(status().isForbidden());
        as(CLIENT, "Rahul", "/api/v1/demo/reset", null).andExpect(status().isForbidden());
        mvc.perform(post(REQUESTS).contentType(MediaType.APPLICATION_JSON).content(CHANGE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ROLE_REQUIRED"));

        // Simulation stays open to every role; team members can also flag extra work as a request.
        as(TEAM, "Arjun", "/api/v1/projects/1/change-orders/simulate", CHANGE).andExpect(status().isOk());
        as(TEAM, "Arjun", REQUESTS, CHANGE)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requestedRole").value(TEAM))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void requestNeedsADescription() throws Exception {
        as(CLIENT, "Rahul", REQUESTS, """
                {"targetTaskId":102,"changeDescription":"  ","addedHours":4,"addedDays":0}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }
}
