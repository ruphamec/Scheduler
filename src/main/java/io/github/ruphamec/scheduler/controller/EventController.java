package io.github.ruphamec.scheduler.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.ruphamec.scheduler.model.ScheduleEvent;
import io.github.ruphamec.scheduler.repository.EventRepository;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final EventRepository eventRepository;

    // Constructor injection: Spring provides the repository automatically
    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    // 1. GET ALL: http://localhost:8080/api/events
    @GetMapping
    public List<ScheduleEvent> getAllEvents() {
        return eventRepository.findAll();
    }

    // 2. GET BY ID: http://localhost:8080/api/events/1
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleEvent> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(event -> ResponseEntity.ok(event))
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. POST (Create): http://localhost:8080/api/events
    @PostMapping
    public ResponseEntity<ScheduleEvent> createEvent(@RequestBody ScheduleEvent event) {
        ScheduleEvent savedEvent = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
    }

    // 4. PUT (Update): http://localhost:8080/api/events/1
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleEvent> updateEvent(@PathVariable Long id, @RequestBody ScheduleEvent updatedData) {
        return eventRepository.findById(id)
                .map(existingEvent -> {
                    existingEvent.setTitle(updatedData.getTitle());
                    existingEvent.setDescription(updatedData.getDescription());
                    existingEvent.setStartTime(updatedData.getStartTime());
                    existingEvent.setEndTime(updatedData.getEndTime());
                    existingEvent.setCompleted(updatedData.isCompleted());
                    existingEvent.setCategory(updatedData.getCategory());
                    
                    ScheduleEvent saved = eventRepository.save(existingEvent);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. DELETE: http://localhost:8080/api/events/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}