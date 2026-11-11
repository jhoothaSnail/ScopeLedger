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
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** HTTP-level tests for Contracts B and C plus the audit log, against the seeded H2 database. */
@SpringBootTest(classes = ScopeLedgerApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ChangeOrderControllerTest {

    private static final String BASE = "/api/v1/projects/1/change-orders";
    private static final String CONTRACT_B_REQUEST = """
            {"targetTaskId":102,"changeDescription":"Switch Email Login to WhatsApp OTP Login",
             "addedHours":12,"addedDays":2,"droppedOptionalTaskIds":[104]}""";

    @Autowired
    private MockMvc mvc;

    @BeforeEach
    void resetSeed() throws Exception {
        mvc.perform(post("/api/v1/demo/reset")).andExpect(status().isOk());
    }

    private ResultActions postJson(String path, String body) throws Exception {
        return mvc.perform(post(BASE + path).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    void simulateMatchesContractB() throws Exception {
        postJson("/simulate", CONTRACT_B_REQUEST)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetTaskId").value(102))
                .andExpect(jsonPath("$.impactedTasks", hasSize(2)))
                .andExpect(jsonPath("$.impactedTasks[0].taskId").value(102))
                .andExpect(jsonPath("$.impactedTasks[0].title").value("Email Login API"))
                .andExpect(jsonPath("$.impactedTasks[0].impactType").value("DIRECT_CHANGE"))
                .andExpect(jsonPath("$.impactedTasks[0].extraHours").value(12.0))
                .andExpect(jsonPath("$.impactedTasks[0].extraCost").value(12000.00))
                .andExpect(jsonPath("$.impactedTasks[0].delayDays").value(2))
                .andExpect(jsonPath("$.impactedTasks[1].taskId").value(103))
                .andExpect(jsonPath("$.impactedTasks[1].impactType").value("DOWNSTREAM_REWORK"))
                .andExpect(jsonPath("$.impactedTasks[1].extraHours").value(8.0))
                .andExpect(jsonPath("$.impactedTasks[1].extraCost").value(8000.00))
                .andExpect(jsonPath("$.impactedTasks[1].delayDays").value(1))
                .andExpect(jsonPath("$.financialSummary.originalBudget").value(100000.00))
                .andExpect(jsonPath("$.financialSummary.changeAndReworkCost").value(20000.00))
                .andExpect(jsonPath("$.financialSummary.optionalTasksSavedCost").value(16000.00))
                .andExpect(jsonPath("$.financialSummary.projectedBudget").value(104000.00))
                .andExpect(jsonPath("$.financialSummary.netBudgetDelta").value(4000.00))
                .andExpect(jsonPath("$.scheduleSummary.originalDurationDays").value(20))
                .andExpect(jsonPath("$.scheduleSummary.grossDelayDays").value(3))
                .andExpect(jsonPath("$.scheduleSummary.daysSavedByDroppingOptional").value(3))
                .andExpect(jsonPath("$.scheduleSummary.projectedDurationDays").value(20))
                .andExpect(jsonPath("$.scheduleSummary.netDaysDelta").value(0))
                .andExpect(jsonPath("$.appliedDropIds[0]").value(104))
                .andExpect(jsonPath("$.candidateTradeOffs", hasSize(3))); // 104, 106, 107 in the 8-task seed
    }

    @Test
    void simulateNeverWrites() throws Exception {
        postJson("/simulate", CONTRACT_B_REQUEST).andExpect(status().isOk());
        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(jsonPath("$.baselineBudget").value(100000.00))
                .andExpect(jsonPath("$.tasks[1].estimatedHours").value(24.0))
                .andExpect(jsonPath("$.tasks[3].isActive").value(true));
        mvc.perform(get(BASE)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void commitUpdatesBoardAndWritesAuditLog() throws Exception {
        postJson("/commit", CONTRACT_B_REQUEST)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(1))
                .andExpect(jsonPath("$.baselineBudget").value(104000.00))
                .andExpect(jsonPath("$.baselineDurationDays").value(20))
                .andExpect(jsonPath("$.tasks[1].estimatedHours").value(36.0))
                .andExpect(jsonPath("$.tasks[1].durationDays").value(6))
                .andExpect(jsonPath("$.tasks[3].isActive").value(false));

        mvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].targetTaskId").value(102))
                .andExpect(jsonPath("$[0].targetTaskTitle").value("Email Login API"))
                .andExpect(jsonPath("$[0].changeDescription").value("Switch Email Login to WhatsApp OTP Login"))
                .andExpect(jsonPath("$[0].netCostDelta").value(4000.00))
                .andExpect(jsonPath("$[0].netDaysDelta").value(0))
                .andExpect(jsonPath("$[0].droppedTasksJson").value("[104]"))
                .andExpect(jsonPath("$[0].committedAt").value(matchesPattern("\\d{4}-\\d{2}-\\d{2}T.*")));
    }

    @Test
    void stackedCommitsUseRolledForwardBaseline() throws Exception {
        postJson("/commit", CONTRACT_B_REQUEST).andExpect(status().isOk());
        postJson("/simulate", """
                {"targetTaskId":105,"changeDescription":"3DS2","addedHours":4,"addedDays":1,"droppedOptionalTaskIds":[]}""")
                .andExpect(jsonPath("$.financialSummary.originalBudget").value(104000.00))
                .andExpect(jsonPath("$.financialSummary.projectedBudget").value(108000.00))
                .andExpect(jsonPath("$.appliedDropIds", hasSize(0)));
    }

    @Test
    void commitRejectsIneligibleDropAndRollsBack() throws Exception {
        postJson("/commit", """
                {"targetTaskId":102,"changeDescription":"x","addedHours":1,"addedDays":0,"droppedOptionalTaskIds":[103]}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_DROP"));
        mvc.perform(get(BASE)).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/v1/projects/1/board")).andExpect(jsonPath("$.tasks[1].estimatedHours").value(24.0));
    }

    @Test
    void simulatePrunesIneligibleDropInsteadOfFailing() throws Exception {
        postJson("/simulate", """
                {"targetTaskId":102,"addedHours":1,"addedDays":0,"droppedOptionalTaskIds":[103]}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appliedDropIds", hasSize(0)));
    }

    @Test
    void validationErrorsReturn400() throws Exception {
        postJson("/commit", """
                {"targetTaskId":102,"changeDescription":"  ","addedHours":1,"addedDays":0}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        postJson("/simulate", """
                {"targetTaskId":102,"addedDays":0}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        postJson("/simulate", """
                {"targetTaskId":999,"addedHours":1,"addedDays":0}""")
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/projects/42/change-orders")).andExpect(status().isNotFound());
    }
}
