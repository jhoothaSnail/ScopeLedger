package com.scopeledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ScopeLedger entry point. On startup Spring runs schema.sql + data.sql, so every boot
 * starts from the canonical 8-task demo project.
 */
@SpringBootApplication
public class ScopeLedgerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScopeLedgerApplication.class, args);
    }
}
