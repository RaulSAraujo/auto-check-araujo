-- Labor is priced from duration and technical level, not a catalog cost.
update public.servicos_catalogo
set custo = 0
where tipo = 'servico'
  and custo <> 0;
