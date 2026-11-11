package com.scopeledger.controller;

import com.scopeledger.dto.CreateDependencyRequestDto;
import com.scopeledger.dto.CreateTaskRequestDto;
import com.scopeledger.dto.DependencyDto;
import com.scopeledger.dto.ProjectBoardResponseDto;
import com.scopeledger.dto.TaskDto;
import com.scopeledger.service.ProjectBoardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Board read + task/dependency CRUD (Contract A). Thin HTTP layer; logic lives in the service. */
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
    public ResponseEntity<TaskDto> createTask(@PathVariable Long projectId, @RequestBody CreateTaskRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createTask(projectId, request));
    }

    @PostMapping("/dependencies")
    public ResponseEntity<DependencyDto> createDependency(@PathVariable Long projectId,
                                                          @RequestBody CreateDependencyRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createDependency(projectId, request));
    }

    @DeleteMapping("/dependencies/{dependencyId}")
    public ResponseEntity<Void> deleteDependency(@PathVariable Long projectId, @PathVariable Long dependencyId) {
        boardService.deleteDependency(projectId, dependencyId);
        return ResponseEntity.noContent().build();
    }
}
