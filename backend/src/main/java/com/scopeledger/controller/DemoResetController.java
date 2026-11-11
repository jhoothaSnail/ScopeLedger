package com.scopeledger.controller;

import com.scopeledger.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.time.Instant;
import java.util.Map;

/**
 * {@code POST /api/v1/demo/reset}: wipes everything (reset.sql), then re-runs schema.sql + data.sql to restore the 8-task demo
 * between evaluator runs. Guarded by {@code app.demo.reset-enabled}.
 */
@RestController
@RequestMapping("/api/v1/demo")
public class DemoResetController {

    private final DataSource dataSource;
    private final boolean resetEnabled;

    public DemoResetController(DataSource dataSource,
                               @Value("${app.demo.reset-enabled:false}") boolean resetEnabled) {
        this.dataSource = dataSource;
        this.resetEnabled = resetEnabled;
    }

    @PostMapping("/reset")
    public Map<String, String> reset() {
        if (!resetEnabled) {
            throw new ApiException(HttpStatus.FORBIDDEN, "DEMO_RESET_DISABLED", "Demo reset is disabled on this server.");
        }
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
                new ClassPathResource("reset.sql"), new ClassPathResource("schema.sql"), new ClassPathResource("data.sql"));
        populator.setSqlScriptEncoding("UTF-8");
        populator.execute(dataSource);
        return Map.of("message", "Demo project restored to its baseline 8-task state.",
                "resetAt", Instant.now().toString());
    }
}
