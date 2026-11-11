package com.scopeledger.backend;

import com.scopeledger.ScopeLedgerApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Smoke test: full context (incl. schema.sql/data.sql) boots against in-memory H2. */
@SpringBootTest(classes = ScopeLedgerApplication.class)
@ActiveProfiles("test")
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }
}
