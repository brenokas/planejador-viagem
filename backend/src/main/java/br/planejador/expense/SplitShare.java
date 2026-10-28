package br.planejador.expense;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class SplitShare {

	@Column(name = "valor_centavos", nullable = false)
	private long valorCentavos;

	@Column(name = "valor_convertido_centavos", nullable = false)
	private long valorConvertidoCentavos;

	protected SplitShare() {
	}

	public SplitShare(long valorCentavos, long valorConvertidoCentavos) {
		this.valorCentavos = valorCentavos;
		this.valorConvertidoCentavos = valorConvertidoCentavos;
	}

	public long getValorCentavos() {
		return valorCentavos;
	}

	public long getValorConvertidoCentavos() {
		return valorConvertidoCentavos;
	}
}
