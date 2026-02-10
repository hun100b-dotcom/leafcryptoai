ALTER TABLE user_settings 
ADD COLUMN whitelist_coins text[] DEFAULT ARRAY['BTC','ETH','SOL','XRP','DOGE','ADA','AVAX','LINK','DOT','MATIC','UNI','ATOM','LTC','BCH','APT'];