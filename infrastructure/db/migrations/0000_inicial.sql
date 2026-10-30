CREATE TABLE `artigos` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`conteudo` text NOT NULL,
	`categoria` text NOT NULL,
	`palavras_chave` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `atualizacoes_de_chamado` (
	`id` text PRIMARY KEY NOT NULL,
	`chamado_codigo` text NOT NULL,
	`autor` text NOT NULL,
	`texto` text NOT NULL,
	`criada_em` integer NOT NULL,
	FOREIGN KEY (`chamado_codigo`) REFERENCES `chamados`(`codigo`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atualizacoes_chamado` ON `atualizacoes_de_chamado` (`chamado_codigo`,`criada_em`);--> statement-breakpoint
CREATE TABLE `chamados` (
	`codigo` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`categoria` text NOT NULL,
	`prioridade` text NOT NULL,
	`status` text NOT NULL,
	`solicitante_id` text NOT NULL,
	`afetados` text NOT NULL,
	`aberto_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	`resolvido_em` integer,
	FOREIGN KEY (`solicitante_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chamados_solicitante` ON `chamados` (`solicitante_id`,`atualizado_em`);--> statement-breakpoint
CREATE TABLE `conversas` (
	`id` text PRIMARY KEY NOT NULL,
	`funcionario_id` text NOT NULL,
	`estado` text NOT NULL,
	`analista_id` text,
	`resumo_para_analista` text,
	`criada_em` integer NOT NULL,
	`atualizada_em` integer NOT NULL,
	FOREIGN KEY (`funcionario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`analista_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_conversas_funcionario` ON `conversas` (`funcionario_id`,`atualizada_em`);--> statement-breakpoint
CREATE INDEX `idx_conversas_estado` ON `conversas` (`estado`,`atualizada_em`);--> statement-breakpoint
CREATE TABLE `mensagens` (
	`id` text PRIMARY KEY NOT NULL,
	`conversa_id` text NOT NULL,
	`autor` text NOT NULL,
	`conteudo` text NOT NULL,
	`criada_em` integer NOT NULL,
	`decisao` text,
	FOREIGN KEY (`conversa_id`) REFERENCES `conversas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mensagens_conversa` ON `mensagens` (`conversa_id`,`criada_em`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`departamento` text NOT NULL,
	`papel` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);