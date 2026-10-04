package io.github.ruphamec.scheduler.controller;

import java.time.format.DateTimeFormatter;
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

import io.github.ruphamec.scheduler.dto.EventRequest;
import io.github.ruphamec.scheduler.model.ScheduleEvent;
import io.github.ruphamec.scheduler.repository.EventRepository;
import jakarta.validation.Valid;

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
    public ResponseEntity<ScheduleEvent> createEvent(@Valid @RequestBody EventRequest request) {
        ScheduleEvent event = new ScheduleEvent();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setCompleted(request.completed());
        event.setCategory(request.category());

        ScheduleEvent saved = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 4. PUT (Update): http://localhost:8080/api/events/1
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleEvent> updateEvent(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return eventRepository.findById(id)
                .map(existingEvent -> {
                    existingEvent.setTitle(request.title());
                    existingEvent.setDescription(request.description());
                    existingEvent.setStartTime(request.startTime());
                    existingEvent.setEndTime(request.endTime());
                    existingEvent.setCompleted(request.completed());
                    existingEvent.setCategory(request.category());
                    
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

    @GetMapping(value = "/calendar.ics", produces = "text/calendar")
    public ResponseEntity<String> getIcsFeed() {
        List<ScheduleEvent> events = eventRepository.findAll();
        DateTimeFormatter icsFormatter = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

        StringBuilder ics = new StringBuilder();
        ics.append("BEGIN:VCALENDAR\r\n");
        ics.append("VERSION:2.0\r\n");
        ics.append("PRODID:-//Ruphamec//Scheduler//EN\r\n");

        for (ScheduleEvent event : events) {
            if (event.getStartTime() == null) continue;

            ics.append("BEGIN:VEVENT\r\n");
            ics.append("UID:").append(event.getId()).append("@scheduler\r\n");
            ics.append("SUMMARY:").append(event.getTitle() != null ? event.getTitle() : "Event").append("\r\n");
            
            if (event.getDescription() != null && !event.getDescription().isBlank()) {
                ics.append("DESCRIPTION:").append(event.getDescription().replace("\n", "\\n")).append("\r\n");
            }

            String startStr = event.getStartTime().format(icsFormatter);
            ics.append("DTSTART:").append(startStr).append("\r\n");

            if (event.getEndTime() != null) {
                String endStr = event.getEndTime().format(icsFormatter);
                ics.append("DTEND:").append(endStr).append("\r\n");
            }

            ics.append("END:VEVENT\r\n");
        }

        ics.append("END:VCALENDAR\r\n");

        return ResponseEntity.ok()
                .header("Content-Disposition", "inline; filename=\"calendar.ics\"")
                .body(ics.toString());
    }
}

