package com.example.whiteboard.controller;

import com.example.whiteboard.model.DrawMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WhiteboardController {

    private final SimpMessagingTemplate messagingTemplate;

    // Dependency injection via constructor
    public WhiteboardController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Intercepts messages directed to a specific room
    @MessageMapping("/draw/{roomId}")
    public void broadcastDrawing(@DestinationVariable String roomId, DrawMessage message) {
        // Routes the message only to the subscribers of that room
        messagingTemplate.convertAndSend("/topic/canvas/" + roomId, message);
    }
}