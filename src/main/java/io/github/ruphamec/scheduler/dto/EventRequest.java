package io.github.ruphamec.scheduler.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record EventRequest(
    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 100, message = "Title must be between 2 and 100 characters")
    String title,

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    String description,

    @NotNull(message = "Start time is required")
    LocalDateTime startTime,

    LocalDateTime endTime,

    boolean completed,

    @Pattern(regexp = "^(Work|Personal|Study|Health)$", message = "Category must be Work, Personal, Study, or Health")
    String category
) {}
