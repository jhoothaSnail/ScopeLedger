package com.scopeledger.repository;

import com.scopeledger.entity.DeliverableTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeliverableTaskRepository extends JpaRepository<DeliverableTask, Long> {
    List<DeliverableTask> findByProjectId(Long projectId);
}