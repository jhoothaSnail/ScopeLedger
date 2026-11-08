package com.scopeledger.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "deliverable_tasks")
public class DeliverableTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private String title;
    private String status; // NOT_STARTED, IN_PROGRESS, COMPLETED
    private Double estimatedHours;
    private Double hourlyRate;
    private Integer durationDays;
    private Boolean isOptional;
    private Boolean isActive;
    // Explicit names: the snake-case strategy maps a trailing capital ("posX") to "posx", not "pos_x".
    @Column(name = "pos_x")
    private Integer posX;
    @Column(name = "pos_y")
    private Integer posY;

    public DeliverableTask() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }

    public Double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }

    public Boolean getIsOptional() { return isOptional; }
    public void setIsOptional(Boolean isOptional) { this.isOptional = isOptional; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getPosX() { return posX; }
    public void setPosX(Integer posX) { this.posX = posX; }

    public Integer getPosY() { return posY; }
    public void setPosY(Integer posY) { this.posY = posY; }
}