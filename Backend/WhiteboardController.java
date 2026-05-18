package com.example.whiteboard.controller;

import com.example.whiteboard.model.DrawMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WhiteboardController {

    // When the frontend sends something to /app/draw, this method receives it
    @MessageMapping("/draw")
    // Whatever this method returns will be automatically sent to all subscribers of /topic/canvas
    @SendTo("/topic/canvas")
    public DrawMessage broadcastDrawing(DrawMessage message) {
        // Receive a user's stroke and broadcast it to everyone in real-time
        return message; 
    }
}