package br.planejador.auth;

import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import br.planejador.config.AppProperties;
import br.planejador.user.User;

@Service
public class TokenService {

	private final JwtEncoder encoder;
	private final AppProperties props;

	public TokenService(JwtEncoder encoder, AppProperties props) {
		this.encoder = encoder;
		this.props = props;
	}

	public String generate(User user) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer("planejador")
				.subject(user.getId().toString())
				.issuedAt(now)
				.expiresAt(now.plus(props.jwt().expiration()))
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}
}
