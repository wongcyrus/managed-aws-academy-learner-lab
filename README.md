# Managed AWS Academy Learner Lab

This project gives Educators have a centralized control to all student’s AWS Academy Learner Lab Account.

For Deployment and user guide, please check my blog post.

https://www.linkedin.com/pulse/how-use-managed-aws-educate-classroom-calendar-build-wong/


To upload sample template to managed-aws-educate-classroom-classroombucket

aws s3 sync ./cloudformation  s3://managed-aws-educate-classroom-classroombucket-1oykzdnmwtrln

# Build and Deploy

Update samconfig.toml

```
./install_all_packages.sh
./build-layer.sh
sam build && sam deploy
```

