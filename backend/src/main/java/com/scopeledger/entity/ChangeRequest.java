package com.scopeledger.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** A change asked for by a client (or project manager) that waits for an approver's decision. */
@Entity
@Table(name = "change_requests")
public class ChangeRequest {

    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long targetTaskId;
    private String changeDescription;
    private Double addedHours;
    private Integer addedDays;
    @Column(columnDefinition = "TEXT")
    private String droppedTasksJson;
    /** Estimated net cost when pending; the actual approved figure once approved. */
    private Double costDelta;
    private Integer daysDelta;
    private String status = PENDING;
    private String requestedBy;
    private String requestedRole;
    private LocalDateTime requestedAt = LocalDateTime.now();
    private String decidedBy;
    private String decidedRole;
    private LocalDateTime decidedAt;
    private String decisionNote;
    /** Optimistic lock: two approvers deciding the same request at once cannot both succeed. */
    @Version
    private Integer version;

    public ChangeRequest() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getTargetTaskId() { return targetTaskId; }
    public void setTargetTaskId(Long targetTaskId) { this.targetTaskId = targetTaskId; }
    public String getChangeDescription() { return changeDescription; }
    public void setChangeDescription(String changeDescription) { this.changeDescription = changeDescription; }
    public Double getAddedHours() { return addedHours; }
    public void setAddedHours(Double addedHours) { this.addedHours = addedHours; }
    public Integer getAddedDays() { return addedDays; }
    public void setAddedDays(Integer addedDays) { this.addedDays = addedDays; }
    public String getDroppedTasksJson() { return droppedTasksJson; }
    public void setDroppedTasksJson(String droppedTasksJson) { this.droppedTasksJson = droppedTasksJson; }
    public Double getCostDelta() { return costDelta; }
    public void setCostDelta(Double costDelta) { this.costDelta = costDelta; }
    public Integer getDaysDelta() { return daysDelta; }
    public void setDaysDelta(Integer daysDelta) { this.daysDelta = daysDelta; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
    public String getRequestedRole() { return requestedRole; }
    public void setRequestedRole(String requestedRole) { this.requestedRole = requestedRole; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
    public String getDecidedBy() { return decidedBy; }
    public void setDecidedBy(String decidedBy) { this.decidedBy = decidedBy; }
    public String getDecidedRole() { return decidedRole; }
    public void setDecidedRole(String decidedRole) { this.decidedRole = decidedRole; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
    public String getDecisionNote() { return decisionNote; }
    public void setDecisionNote(String decisionNote) { this.decisionNote = decisionNote; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
