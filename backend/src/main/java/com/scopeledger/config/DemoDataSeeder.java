package com.scopeledger.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Seeds the 8-task sample project exactly once: on startup, and only if no project exists yet.
 * Restarts and redeploys therefore never overwrite real data (schema.sql is idempotent too).
 */
@Component
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbc;
    private final boolean enabled;

    public DemoDataSeeder(DataSource dataSource, @Value("${app.seed.on-empty:true}") boolean enabled) {
        this.dataSource = dataSource;
        this.jdbc = new JdbcTemplate(dataSource);
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedIfEmpty();
    }

    /** @return true if sample data was inserted, false if seeding was skipped */
    public boolean seedIfEmpty() {
        if (!enabled) {
            return false;
        }
        Integer projects = jdbc.queryForObject("SELECT COUNT(*) FROM projects", Integer.class);
        if (projects != null && projects > 0) {
            log.info("Database already contains {} project(s); skipping sample-data seed.", projects);
            return false;
        }
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("data.sql"));
        populator.setSqlScriptEncoding("UTF-8");
        populator.execute(dataSource);
        log.info("Empty database detected; seeded the sample project.");
        return true;
    }
}
