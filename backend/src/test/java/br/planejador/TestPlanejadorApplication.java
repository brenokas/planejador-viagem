package br.planejador;

import org.springframework.boot.SpringApplication;

public class TestPlanejadorApplication {

	public static void main(String[] args) {
		SpringApplication.from(PlanejadorApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
