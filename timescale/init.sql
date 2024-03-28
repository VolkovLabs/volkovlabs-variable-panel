CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE metrics (
    id integer NOT NULL,
    time timestamp with time zone NOT NULL,
    name text NOT NULL,
    value DOUBLE PRECISION NULL
);

CREATE TABLE devices (
    id integer NOT NULL,
    name text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text NOT NULL
);

CREATE TABLE dashboards (
    device_id text NOT NULL,
    dashboard_id text NOT NULL
);

CREATE SEQUENCE seq_metrics START 1;
CREATE SEQUENCE seq_devices START 1;

SELECT create_hypertable('metrics','time');

CREATE INDEX ix_metrics_name_time ON metrics (name, time DESC);

CREATE TABLE device_time (
    id integer NOT NULL,
    name text NOT NULL,
    value integer
);

insert into devices values (nextval('seq_devices'), 'Chicago North 125', 'Chicago', 'IL', 'USA');
insert into devices values (nextval('seq_devices'), 'Chicago North 242', 'Chicago', 'IL', 'USA');
insert into devices values (nextval('seq_devices'), 'Tampa South 124', 'Tampa', 'FL', 'USA');
insert into devices values (nextval('seq_devices'), 'Tampa South 232', 'Tampa', 'FL', 'USA');
insert into devices values (nextval('seq_devices'), 'NY Central 133', 'New York', 'NY', 'USA');
insert into devices values (nextval('seq_devices'), 'NY Central 221', 'New York', 'NY', 'USA');
insert into devices values (nextval('seq_devices'), 'NY Beach 213', 'New York', 'NY', 'USA');
insert into devices values (nextval('seq_devices'), 'NY South 432', 'New York', 'NY', 'USA');
insert into devices values (nextval('seq_devices'), 'Sweden 192', 'Stockholm', 'Stockholm', 'Sweden');
insert into devices values (nextval('seq_devices'), 'Sweden 299', 'Stockholm', 'Stockholm', 'Sweden');
insert into devices values (nextval('seq_devices'), 'RU 198 BU', 'Moscow', 'Moscow', 'Russia');
insert into devices values (nextval('seq_devices'), 'RU 12 BU', 'Moscow', 'Moscow', 'Russia');
insert into devices values (nextval('seq_devices'), 'JPY 398', 'Tokyo', 'Tokyo', 'Japan');
insert into devices values (nextval('seq_devices'), 'JPY 176', 'Tokyo', 'Tokyo', 'Japan');
insert into devices values (nextval('seq_devices'), 'Asia 287', 'Singapore', 'Singapore', 'Singapore');
insert into devices values (nextval('seq_devices'), 'Asia 987', 'Singapore', 'Singapore', 'Singapore');

insert into dashboards values('Chicago North 125', 'e591d2bb-5bce-40ae-9df7-70c1aace684c');
insert into dashboards values('Chicago North 242', 'O4tc_E6Gz');
insert into dashboards values('Tampa South 124', 'e591d2bb-5bce-40ae-9df7-70c1aace684c');

insert into device_time values(1, 'device1', 1);
insert into device_time values(2, 'device1', 2);
insert into device_time values(3, 'device1', 3);
insert into device_time values(4, 'device2', 2);
insert into device_time values(5, 'device2', 3);
insert into device_time values(6, 'device3', 3);
