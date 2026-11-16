package com.workora.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Pages that exist only inside the React app. Refreshing the browser on one of them
 * must return index.html, and React Router then shows the right page.
 * Add a path here whenever you add a new top-level route in App.tsx.
 */
@Controller
public class SpaController {

    @GetMapping({"/login", "/register", "/dashboard"})
    public String forwardToReact() {
        return "forward:/index.html";
    }
}