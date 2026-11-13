package workora_api;

import org.springframework.boot.SpringApplication;

public class TestWorkoraApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(WorkoraApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
