import ContainerV2 = require("./ContainerV2");
import ContainerV3 = require("./ContainerV3");

type Container = ContainerV2 | ContainerV3;

export = Container;
