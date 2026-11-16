package com.scopeledger.repository;

import com.scopeledger.entity.ChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long> {
    List<ChangeRequest> findByProjectId(Long projectId);

    Optional<ChangeRequest> findByIdAndProjectId(Long id, Long projectId);
}
