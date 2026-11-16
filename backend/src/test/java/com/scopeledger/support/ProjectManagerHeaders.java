package com.scopeledger.support;

import com.scopeledger.security.Actor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * Sends every MockMvc request as the Project Manager (the role allowed to do everything), so
 * tests that are not about permissions stay focused. A request that sets the header itself wins.
 */
@TestConfiguration
public class ProjectManagerHeaders {

    @Bean
    MockMvcBuilderCustomizer projectManagerByDefault() {
        return builder -> builder.defaultRequest(get("/")
                .header(Actor.ROLE_HEADER, "Project Manager")
                .header(Actor.NAME_HEADER, "Priya%20Sharma"));
    }
}
