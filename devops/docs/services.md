backend1:
    backend1 is nestjs service that is resposible for auth and chant/notification.
    it deponds on postgresql service.
    * it needs to connect to postgresql using
        -> secrets:
            1. suf_user: database user
            2. suf_password: database password
        -> and also env:
            1. POSTGRES_DB
            2. POSTGRES_PORT
    * it needs to connect to REDIS
        -> secrets:
            redis_password
        -> env: 
            REDIS_PORT

