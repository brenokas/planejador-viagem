package br.planejador.geo;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.geo.GeoService.GeoPlace;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

	private final GeoService geo;

	public GeoController(GeoService geo) {
		this.geo = geo;
	}

	@GetMapping("/search")
	List<GeoPlace> search(@RequestParam String q) {
		return geo.search(q);
	}
}
