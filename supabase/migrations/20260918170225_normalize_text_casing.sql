-- One-shot: normalize free-text casing to match app rules
-- Title Case (PT particles): names, vehicle labels, catalog/supplier/category names
-- Sentence case: descriptions, observations, OS/scheduling free text
-- Bypass auth triggers (auth_papel is null during migrations).

CREATE OR REPLACE FUNCTION public.app_title_case_pt(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  words text[];
  result text := '';
  i int;
  lower_w text;
  w text;
BEGIN
  IF p IS NULL THEN
    RETURN NULL;
  END IF;

  p := btrim(regexp_replace(p, '\s+', ' ', 'g'));
  IF p = '' THEN
    RETURN NULL;
  END IF;

  words := string_to_array(p, ' ');
  FOR i IN 1..coalesce(array_length(words, 1), 0) LOOP
    lower_w := lower(words[i]);
    IF i > 1 AND lower_w IN ('da', 'de', 'do', 'dos', 'das', 'e') THEN
      w := lower_w;
    ELSE
      w := upper(left(lower_w, 1)) || substr(lower_w, 2);
    END IF;
    IF i > 1 THEN
      result := result || ' ';
    END IF;
    result := result || w;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.app_sentence_case(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  normalized text;
BEGIN
  IF p IS NULL THEN
    RETURN NULL;
  END IF;

  normalized := btrim(regexp_replace(p, '\s+', ' ', 'g'));
  IF normalized = '' THEN
    RETURN NULL;
  END IF;

  normalized := lower(normalized);
  RETURN upper(left(normalized, 1)) || substr(normalized, 2);
END;
$$;

-- Disable user triggers (e.g. validate_ordem_servico_update requires auth_papel).
SET LOCAL session_replication_role = replica;

UPDATE clientes
SET
  nome = public.app_title_case_pt(nome),
  observacoes = public.app_sentence_case(observacoes);

UPDATE veiculos
SET
  marca = public.app_title_case_pt(marca),
  modelo = public.app_title_case_pt(modelo),
  cor = public.app_title_case_pt(cor),
  observacoes = public.app_sentence_case(observacoes),
  placa = upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g'));

UPDATE ordens_servico
SET
  reclamacao = public.app_sentence_case(reclamacao),
  diagnostico = public.app_sentence_case(diagnostico),
  observacoes = public.app_sentence_case(observacoes);

UPDATE ordem_itens
SET descricao = public.app_sentence_case(descricao);

UPDATE servicos_catalogo
SET nome = public.app_title_case_pt(nome);

UPDATE fornecedores
SET
  nome = public.app_title_case_pt(nome),
  observacoes = public.app_sentence_case(observacoes);

UPDATE financeiro_categorias
SET nome = public.app_title_case_pt(nome);

UPDATE financeiro_contas
SET
  descricao = public.app_sentence_case(descricao),
  observacoes = public.app_sentence_case(observacoes);

UPDATE profiles
SET nome = public.app_title_case_pt(nome);

UPDATE agendamentos
SET
  servico = public.app_sentence_case(servico),
  observacoes = public.app_sentence_case(observacoes);

SET LOCAL session_replication_role = origin;

DROP FUNCTION public.app_title_case_pt(text);
DROP FUNCTION public.app_sentence_case(text);
