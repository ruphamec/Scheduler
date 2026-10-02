package io.github.ruphamec.scheduler.controller;

import org.junit.jupiter.api.DisplayName; // 1. Import your handler
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean; // 2. Import @Import
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.ruphamec.scheduler.exception.GlobalExceptionHandler;
import io.github.ruphamec.scheduler.repository.EventRepository;

@WebMvcTest(EventController.class)
@Import(GlobalExceptionHandler.class) // <--- 3. Tell the test slice to use this handler
class EventControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventRepository eventRepository;

    @Test
    @DisplayName("POST /api/events with invalid fields should return 400 Bad Request")
    void whenPayloadIsInvalid_thenReturn400() throws Exception {
        String invalidJson = """
            {
                "title": "",
                "category": "UnknownCategory",
                "startTime": null
            }
        """;

        mockMvc.perform(post("/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").exists())
                .andExpect(jsonPath("$.category").value("Category must be Work, Personal, Study, or Health"))
                .andExpect(jsonPath("$.startTime").value("Start time is required"));
    }
}