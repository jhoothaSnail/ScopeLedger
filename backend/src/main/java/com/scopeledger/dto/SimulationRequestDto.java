package com.scopeledger.dto;

import java.util.List;

public record SimulationRequestDto(
        Long targetTaskId,
        String changeDescription,
        Double addedHours,
        Integer addedDays,
        List<Long> droppedOptionalTaskIds
) {}