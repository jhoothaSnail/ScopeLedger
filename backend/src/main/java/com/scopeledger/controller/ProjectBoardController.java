package com.scopeledger.controller;

import com.scopeledger.dto.CreateDependencyRequestDto;
import com.scopeledger.dto.CreateTaskRequestDto;
import com.scopeledger.dto.DependencyDto;
import com.scopeledger.dto.ProjectBoardResponseDto;
import com.scopeledger.dto.TaskDto;
import com.scopeledger.dto.TaskStatusUpdateDto;
import com.scopeledger.security.Actor;
import com.scopeledger.security.Permission;
import com.scopeledger.service.ProjectBoardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Board read + task/dependency CRUD (Contract A). Plan edits are limited to the Project Manager;
 * task progress can also be updated by Team Members, who do the work.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}")
public class ProjectBoardController {

    private final ProjectBoardService boardService;

    public ProjectBoardController(ProjectBoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping("/board")
    public ProjectBoardResponseDto getBoard(@PathVariable Long projectId) {
        return boardService.getBoard(projectId);
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(@PathVariable Long projectId, @RequestBody CreateTaskRequestDto request,
                                              @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role) {
        Actor.from(role, null).require(Permission.EDIT_PLAN);
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createTask(projectId, request));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public TaskDto updateTaskStatus(@PathVariable Long projectId, @PathVariable Long taskId,
                                    @RequestBody TaskStatusUpdateDto request,
                                    @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role) {
        Actor.from(role, null).require(Permission.UPDATE_PROGRESS);
        return boardService.updateTaskStatus(projectId, taskId, request == null ? null : request.status());
    }

    @PostMapping("/dependencies")
    public ResponseEntity<DependencyDto> createDependency(@PathVariable Long projectId,
                                                          @RequestBody CreateDependencyRequestDto request,
                                                          @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role) {
        Actor.from(role, null).require(Permission.EDIT_PLAN);
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createDependency(projectId, request));
    }

    @DeleteMapping("/dependencies/{dependencyId}")
    public ResponseEntity<Void> deleteDependency(@PathVariable Long projectId, @PathVariable Long dependencyId,
                                                 @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role) {
        Actor.from(role, null).require(Permission.EDIT_PLAN);
        boardService.deleteDependency(projectId, dependencyId);
        return ResponseEntity.noContent().build();
    }
}
