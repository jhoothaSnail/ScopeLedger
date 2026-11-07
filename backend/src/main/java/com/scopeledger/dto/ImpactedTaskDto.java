// File: backend/src/main/java/com/scopeledger/dto/ImpactedTaskDto.java
package com.scopeledger.dto;

import java.math.BigDecimal;

public record ImpactedTaskDto(
        Long taskId,
        String title,
        String impactType, // DIRECT_CHANGE, DOWNSTREAM_REWORK
        Double extraHours,
        BigDecimal extraCost,
        Integer delayDays
) {}