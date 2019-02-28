// npm packages
const fs = require('fs');
const path = require('path');

const phpDockerfile = `FROM arm32v7/php:7.2-apache
COPY . /var/www/html/
RUN chmod -R 755 /var/www/html/
EXPOSE 80
EXPOSE 443
`;

// template name
exports.name = 'exoframe-template-arm32v7-php';

// function to check if the template fits this recipe
exports.checkTemplate = async ({tempDockerDir, folder}) => {
  // if project already has dockerfile - just exit
  try {
    const filesList = fs.readdirSync(path.join(tempDockerDir, folder));
    if (filesList.includes('index.php')) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

// function to execute current template
exports.executeTemplate = async ({username, tempDockerDir, folder, resultStream, util, docker, existing}) => {
  try {
    // generate dockerfile
    const dockerfile = phpDockerfile;
    const dfPath = path.join(tempDockerDir, folder, 'Dockerfile');
    fs.writeFileSync(dfPath, dockerfile, 'utf-8');
    util.writeStatus(resultStream, {message: 'Deploying PHP Apache project..', level: 'info'});

    // build docker image
    const buildRes = await docker.build({username, folder, resultStream});
    util.logger.debug('Build result:', buildRes);

    // start image
    const container = await docker.start(Object.assign({}, buildRes, {username, folder, existing, resultStream}));
    util.logger.debug(container);

    // return new deployments
    util.writeStatus(resultStream, {message: 'Deployment success!', deployments: [container], level: 'info'});
    resultStream.end('');
  } catch (e) {
    util.logger.debug('build failed!', e);
    util.writeStatus(resultStream, {message: e.error, error: e.error, log: e.log, level: 'error'});
    resultStream.end('');
  }
};