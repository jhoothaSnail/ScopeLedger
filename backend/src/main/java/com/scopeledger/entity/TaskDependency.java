package com.scopeledger.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "task_dependencies")
public class TaskDependency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private Long prerequisiteTaskId;
    private Long dependentTaskId;

    public TaskDependency() {}

    public TaskDependency(Long id, Long projectId, Long prerequisiteTaskId, Long dependentTaskId) {
        this.id = id;
        this.projectId = projectId;
        this.prerequisiteTaskId = prerequisiteTaskId;
        this.dependentTaskId = dependentTaskId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getPrerequisiteTaskId() { return prerequisiteTaskId; }
    public void setPrerequisiteTaskId(Long prerequisiteTaskId) { this.prerequisiteTaskId = prerequisiteTaskId; }

    public Long getDependentTaskId() { return dependentTaskId; }
    public void setDependentTaskId(Long dependentTaskId) { this.dependentTaskId = dependentTaskId; }
}