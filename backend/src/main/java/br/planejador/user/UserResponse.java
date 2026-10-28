package br.planejador.user;

public record UserResponse(Long id, String nome, String email, String avatarUrl) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getNome(), user.getEmail(), user.getAvatarUrl());
	}
}
