package com.scopeledger.repository;

import com.scopeledger.entity.ChangeOrderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChangeOrderLogRepository extends JpaRepository<ChangeOrderLog, Long> {
    List<ChangeOrderLog> findByProjectId(Long projectId);
}