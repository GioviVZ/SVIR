package com.svir.api.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-ui/index.html",
                                "/error"
                        ).permitAll()

                        // Catálogo público: cualquiera puede ver productos
                        .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()
                        .requestMatchers("/api/productos/**").hasAnyRole("ADMIN", "VENTAS")
                        // Pedidos web sin autenticación (tienda online)
                        .requestMatchers(HttpMethod.POST, "/api/pedidos").permitAll()
                        .requestMatchers("/api/pedidos/**").hasAnyRole("ADMIN", "VENTAS")
                        .requestMatchers("/api/ingredientes/**").hasAnyRole("ADMIN", "COCINA")
                        .requestMatchers("/api/recetas/**").hasAnyRole("ADMIN", "COCINA")
                        .requestMatchers("/api/producciones/**").hasAnyRole("ADMIN", "COCINA")
                        .requestMatchers("/api/movimientos/**").hasAnyRole("ADMIN", "VENTAS", "COCINA")
                        .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "VENTAS", "COCINA")
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        // Registro e inicio de sesión público para clientes de la tienda web
                        .requestMatchers(HttpMethod.POST, "/api/clientes/registro").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/clientes/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/clientes/buscar").permitAll()
                        .requestMatchers("/api/clientes/**").hasAnyRole("ADMIN", "VENTAS")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}