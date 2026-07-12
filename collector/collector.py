alter table instruments add column if not exists forward_eps    numeric;
alter table instruments add column if not exists n_analysts     int;
alter table instruments add column if not exists recommendation text;
