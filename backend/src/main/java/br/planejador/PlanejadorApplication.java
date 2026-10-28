package br.planejador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PlanejadorApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlanejadorApplication.class, args);
	}

}
