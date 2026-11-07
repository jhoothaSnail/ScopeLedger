package com.scopeledger.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Double baselineBudget;
    private Integer baselineDurationDays;
    private Double reworkPenaltyRate;

    public Project() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getBaselineBudget() { return baselineBudget; }
    public void setBaselineBudget(Double baselineBudget) { this.baselineBudget = baselineBudget; }

    public Integer getBaselineDurationDays() { return baselineDurationDays; }
    public void setBaselineDurationDays(Integer baselineDurationDays) { this.baselineDurationDays = baselineDurationDays; }

    public Double getReworkPenaltyRate() { return reworkPenaltyRate; }
    public void setReworkPenaltyRate(Double reworkPenaltyRate) { this.reworkPenaltyRate = reworkPenaltyRate; }
}