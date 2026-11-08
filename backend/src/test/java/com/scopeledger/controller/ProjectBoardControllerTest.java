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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** HTTP-level tests for Contract A and board CRUD against the seeded in-memory H2 database. */
@SpringBootTest(classes = ScopeLedgerApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectBoardControllerTest {

    @Autowired
    private MockMvc mvc;

    /** Each test starts from the canonical seed (also exercises the demo-reset endpoint). */
    @BeforeEach
    void resetSeed() throws Exception {
        mvc.perform(post("/api/v1/demo/reset")).andExpect(status().isOk());
    }

    @Test
    void boardMatchesContractA() throws Exception {
        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.name").value("E-Commerce Checkout & Auth System"))
                .andExpect(jsonPath("$.baselineBudget").value(100000.00))
                .andExpect(jsonPath("$.baselineDurationDays").value(20))
                .andExpect(jsonPath("$.reworkPenaltyRate").value(0.25))
                .andExpect(jsonPath("$.tasks", hasSize(8)))
                .andExpect(jsonPath("$.tasks[0].id").value(101))
                .andExpect(jsonPath("$.tasks[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.tasks[0].hourlyRate").value(1000.00))
                .andExpect(jsonPath("$.tasks[3].isOptional").value(true))
                .andExpect(jsonPath("$.tasks[3].isActive").value(true))
                .andExpect(jsonPath("$.tasks[0].posX").value(100))
                .andExpect(jsonPath("$.dependencies[0].prerequisiteTaskId").value(101))
                .andExpect(jsonPath("$.dependencies[0].dependentTaskId").value(102));
    }

    @Test
    void unknownProjectReturns404Json() throws Exception {
        mvc.perform(get("/api/v1/projects/999/board"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void circularLinkIsRejected_planPhase1Check() throws Exception {
        mvc.perform(post("/api/v1/projects/1/dependencies").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prerequisiteTaskId\":103,\"dependentTaskId\":101}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("CIRCULAR_DEPENDENCY"));
    }

    @Test
    void duplicateLinkIsRejected() throws Exception {
        mvc.perform(post("/api/v1/projects/1/dependencies").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prerequisiteTaskId\":101,\"dependentTaskId\":102}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_DEPENDENCY"));
    }

    @Test
    void createTaskThenLinkAndUnlink() throws Exception {
        // Also proves AUTO_INCREMENT does not collide with the explicit seed IDs.
        mvc.perform(post("/api/v1/projects/1/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Load Testing\",\"estimatedHours\":10,\"hourlyRate\":1200,"
                                + "\"durationDays\":2,\"isOptional\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Load Testing"))
                .andExpect(jsonPath("$.status").value("NOT_STARTED"))
                .andExpect(jsonPath("$.isOptional").value(true));

        mvc.perform(post("/api/v1/projects/1/dependencies").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prerequisiteTaskId\":104,\"dependentTaskId\":106}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.prerequisiteTaskId").value(104));

        mvc.perform(delete("/api/v1/projects/1/dependencies/501")).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(jsonPath("$.tasks", hasSize(9)))
                .andExpect(jsonPath("$.dependencies", hasSize(7)));
    }

    @Test
    void dependencyFromAnotherProjectOrUnknownIs404() throws Exception {
        mvc.perform(delete("/api/v1/projects/1/dependencies/9999")).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/projects/1/dependencies").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prerequisiteTaskId\":101,\"dependentTaskId\":9999}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidTaskAndMalformedJsonReturn400() throws Exception {
        mvc.perform(post("/api/v1/projects/1/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        mvc.perform(post("/api/v1/projects/1/tasks").contentType(MediaType.APPLICATION_JSON).content("{oops"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MALFORMED_REQUEST"));
    }
}
