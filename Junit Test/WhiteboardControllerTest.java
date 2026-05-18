package com.example.whiteboard.controller;

import com.example.whiteboard.model.DrawMessage;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class WhiteboardControllerTest {

    @Test
    void testBroadcastDrawing() {
        WhiteboardController controller = new WhiteboardController();
        DrawMessage input = new DrawMessage(
            DrawMessage.MessageType.DRAW, 10.5, 20.5, "#FF5733", 5, "user-1"
        );

        DrawMessage output = controller.broadcastDrawing(input);

        assertNotNull(output);
        assertEquals(input, output);
        assertEquals("user-1", output.getSenderId());
    }
}