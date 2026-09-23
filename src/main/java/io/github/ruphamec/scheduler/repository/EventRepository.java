package io.github.ruphamec.scheduler.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import io.github.ruphamec.scheduler.model.ScheduleEvent;

@Repository
public interface EventRepository extends JpaRepository<ScheduleEvent, Long> {
    // Spring Data JPA automatically writes the SQL query for this method based on its name
    List<ScheduleEvent> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    // Find all events filtered by completion status
    List<ScheduleEvent> findByCompleted(boolean completed);
}