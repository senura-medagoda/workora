package com.workora;

import org.springframework.boot.SpringApplication;

public class TestWorkoraApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(WorkoraApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
