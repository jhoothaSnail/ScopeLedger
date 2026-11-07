package com.scopeledger.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "change_order_logs")
public class ChangeOrderLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long targetTaskId;
    private String changeDescription;
    private Double netCostDelta;
    private Integer netDaysDelta;
    @Column(columnDefinition = "TEXT")
    private String droppedTasksJson;
    private LocalDateTime committedAt = LocalDateTime.now();

    public ChangeOrderLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getTargetTaskId() { return targetTaskId; }
    public void setTargetTaskId(Long targetTaskId) { this.targetTaskId = targetTaskId; }

    public String getChangeDescription() { return changeDescription; }
    public void setChangeDescription(String changeDescription) { this.changeDescription = changeDescription; }

    public Double getNetCostDelta() { return netCostDelta; }
    public void setNetCostDelta(Double netCostDelta) { this.netCostDelta = netCostDelta; }

    public Integer getNetDaysDelta() { return netDaysDelta; }
    public void setNetDaysDelta(Integer netDaysDelta) { this.netDaysDelta = netDaysDelta; }

    public String getDroppedTasksJson() { return droppedTasksJson; }
    public void setDroppedTasksJson(String droppedTasksJson) { this.droppedTasksJson = droppedTasksJson; }

    public LocalDateTime getCommittedAt() { return committedAt; }
    public void setCommittedAt(LocalDateTime committedAt) { this.committedAt = committedAt; }
}