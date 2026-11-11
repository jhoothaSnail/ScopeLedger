package com.scopeledger.controller;

import com.scopeledger.ScopeLedgerApplication;
import com.scopeledger.config.DemoDataSeeder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Guards the behaviours a hosted deployment depends on: restarts keep data, empty DBs get seeded. */
@SpringBootTest(classes = ScopeLedgerApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DeploymentReadinessTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private DemoDataSeeder seeder;
    @Autowired
    private DataSource dataSource;

    @BeforeEach
    void resetSeed() throws Exception {
        mvc.perform(post("/api/v1/demo/reset")).andExpect(status().isOk());
    }

    private void runScripts(String... names) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        for (String n : names) {
            populator.addScript(new ClassPathResource(n));
        }
        populator.execute(dataSource);
    }

    private void commitSampleChange() throws Exception {
        mvc.perform(post("/api/v1/projects/1/change-orders/commit").contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetTaskId\":102,\"changeDescription\":\"Switch to OTP\",\"addedHours\":12,"
                        + "\"addedDays\":2,\"droppedOptionalTaskIds\":[104]}")).andExpect(status().isOk());
    }

    @Test
    void healthEndpointReportsUp() throws Exception {
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void restartDoesNotWipeOrReseedExistingData() throws Exception {
        commitSampleChange();

        // What happens on an application restart or redeploy:
        runScripts("schema.sql");               // idempotent: must not drop or fail
        assertFalse(seeder.seedIfEmpty());      // data present: must not re-seed

        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(jsonPath("$.baselineBudget").value(104000.00))
                .andExpect(jsonPath("$.tasks", hasSize(8)))
                .andExpect(jsonPath("$.tasks[1].estimatedHours").value(36.0))
                .andExpect(jsonPath("$.tasks[3].isActive").value(false));
        mvc.perform(get("/api/v1/projects/1/change-orders")).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void emptyDatabaseIsSeededOnce() throws Exception {
        runScripts("reset.sql", "schema.sql");  // brand-new empty database
        mvc.perform(get("/api/v1/projects/1/board")).andExpect(status().isNotFound());

        assertTrue(seeder.seedIfEmpty());
        assertFalse(seeder.seedIfEmpty());      // second call is a no-op

        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks", hasSize(8)))
                .andExpect(jsonPath("$.dependencies", hasSize(7)));
    }

    @Test
    void auditTimestampsCarryAUtcOffset() throws Exception {
        commitSampleChange();
        mvc.perform(get("/api/v1/projects/1/change-orders"))
                .andExpect(jsonPath("$[0].committedAt")
                        .value(matchesPattern("\\d{4}-\\d{2}-\\d{2}T[\\d:.]+(Z|[+-]\\d{2}:\\d{2})")));
    }

    @Test
    void resetStillRestoresSampleProject() throws Exception {
        commitSampleChange();
        mvc.perform(post("/api/v1/demo/reset")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/projects/1/board"))
                .andExpect(jsonPath("$.baselineBudget").value(100000.00))
                .andExpect(jsonPath("$.tasks[3].isActive").value(true));
        mvc.perform(get("/api/v1/projects/1/change-orders")).andExpect(jsonPath("$", hasSize(0)));
    }
}
