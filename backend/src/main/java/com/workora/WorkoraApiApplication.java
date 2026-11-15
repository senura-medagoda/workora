package com.workora;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class WorkoraApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(WorkoraApiApplication.class, args);
	}

}
