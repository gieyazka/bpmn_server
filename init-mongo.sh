mongosh -- "bpmn" <<EOF
    var rootUser = '$MONGO_INITDB_ROOT_USERNAME';
    var rootPassword = '$MONGO_INITDB_ROOT_PASSWORD';
    var admin = db.getSiblingDB('admin');
    admin.auth(rootUser, rootPassword);
    var user = '$MONGO_INITDB_ROOT_USERNAME';
    var passwd = '$MONGO_INITDB_ROOT_PASSWORD';
    use bpmn
    db.createUser({
      user: user,
      pwd: passwd,
      roles: [{ role: "root", db: "admin" }]
    });
EOF