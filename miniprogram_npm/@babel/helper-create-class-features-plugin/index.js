module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1757467947481, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "FEATURES", {
  enumerable: true,
  get: function () {
    return _features.FEATURES;
  }
});
Object.defineProperty(exports, "buildCheckInRHS", {
  enumerable: true,
  get: function () {
    return _fields.buildCheckInRHS;
  }
});
Object.defineProperty(exports, "buildNamedEvaluationVisitor", {
  enumerable: true,
  get: function () {
    return _decorators.buildNamedEvaluationVisitor;
  }
});
exports.createClassFeaturePlugin = createClassFeaturePlugin;
Object.defineProperty(exports, "enableFeature", {
  enumerable: true,
  get: function () {
    return _features.enableFeature;
  }
});
Object.defineProperty(exports, "injectInitialization", {
  enumerable: true,
  get: function () {
    return _misc.injectInitialization;
  }
});
var _core = require("@babel/core");
var _semver = require("semver");
var _fields = require("./fields.js");
var _decorators = require("./decorators.js");
var _decorators2 = require("./decorators-2018-09.js");
var _misc = require("./misc.js");
var _features = require("./features.js");
var _typescript = require("./typescript.js");
const versionKey = "@babel/plugin-class-features/version";
function createClassFeaturePlugin({
  name,
  feature,
  loose,
  manipulateOptions,
  api,
  inherits,
  decoratorVersion
}) {
  var _api$assumption;
  if (feature & _features.FEATURES.decorators) {
    {
      if (decoratorVersion === "2023-11" || decoratorVersion === "2023-05" || decoratorVersion === "2023-01" || decoratorVersion === "2022-03" || decoratorVersion === "2021-12") {
        return (0, _decorators.default)(api, {
          loose
        }, decoratorVersion, inherits);
      }
    }
  }
  {
    api != null ? api : api = {
      assumption: () => void 0
    };
  }
  const setPublicClassFields = api.assumption("setPublicClassFields");
  const privateFieldsAsSymbols = api.assumption("privateFieldsAsSymbols");
  const privateFieldsAsProperties = api.assumption("privateFieldsAsProperties");
  const noUninitializedPrivateFieldAccess = (_api$assumption = api.assumption("noUninitializedPrivateFieldAccess")) != null ? _api$assumption : false;
  const constantSuper = api.assumption("constantSuper");
  const noDocumentAll = api.assumption("noDocumentAll");
  if (privateFieldsAsProperties && privateFieldsAsSymbols) {
    throw new Error(`Cannot enable both the "privateFieldsAsProperties" and ` + `"privateFieldsAsSymbols" assumptions as the same time.`);
  }
  const privateFieldsAsSymbolsOrProperties = privateFieldsAsProperties || privateFieldsAsSymbols;
  if (loose === true) {
    const explicit = [];
    if (setPublicClassFields !== undefined) {
      explicit.push(`"setPublicClassFields"`);
    }
    if (privateFieldsAsProperties !== undefined) {
      explicit.push(`"privateFieldsAsProperties"`);
    }
    if (privateFieldsAsSymbols !== undefined) {
      explicit.push(`"privateFieldsAsSymbols"`);
    }
    if (explicit.length !== 0) {
      console.warn(`[${name}]: You are using the "loose: true" option and you are` + ` explicitly setting a value for the ${explicit.join(" and ")}` + ` assumption${explicit.length > 1 ? "s" : ""}. The "loose" option` + ` can cause incompatibilities with the other class features` + ` plugins, so it's recommended that you replace it with the` + ` following top-level option:\n` + `\t"assumptions": {\n` + `\t\t"setPublicClassFields": true,\n` + `\t\t"privateFieldsAsSymbols": true\n` + `\t}`);
    }
  }
  return {
    name,
    manipulateOptions,
    inherits,
    pre(file) {
      (0, _features.enableFeature)(file, feature, loose);
      {
        if (typeof file.get(versionKey) === "number") {
          file.set(versionKey, "7.28.3");
          return;
        }
      }
      if (!file.get(versionKey) || _semver.lt(file.get(versionKey), "7.28.3")) {
        file.set(versionKey, "7.28.3");
      }
    },
    visitor: {
      Class(path, {
        file
      }) {
        if (file.get(versionKey) !== "7.28.3") return;
        if (!(0, _features.shouldTransform)(path, file)) return;
        const pathIsClassDeclaration = path.isClassDeclaration();
        if (pathIsClassDeclaration) (0, _typescript.assertFieldTransformed)(path);
        const loose = (0, _features.isLoose)(file, feature);
        let constructor;
        const isDecorated = (0, _decorators.hasDecorators)(path.node);
        const props = [];
        const elements = [];
        const computedPaths = [];
        const privateNames = new Set();
        const body = path.get("body");
        for (const path of body.get("body")) {
          if ((path.isClassProperty() || path.isClassMethod()) && path.node.computed) {
            computedPaths.push(path);
          }
          if (path.isPrivate()) {
            const {
              name
            } = path.node.key.id;
            const getName = `get ${name}`;
            const setName = `set ${name}`;
            if (path.isClassPrivateMethod()) {
              if (path.node.kind === "get") {
                if (privateNames.has(getName) || privateNames.has(name) && !privateNames.has(setName)) {
                  throw path.buildCodeFrameError("Duplicate private field");
                }
                privateNames.add(getName).add(name);
              } else if (path.node.kind === "set") {
                if (privateNames.has(setName) || privateNames.has(name) && !privateNames.has(getName)) {
                  throw path.buildCodeFrameError("Duplicate private field");
                }
                privateNames.add(setName).add(name);
              }
            } else {
              if (privateNames.has(name) && !privateNames.has(getName) && !privateNames.has(setName) || privateNames.has(name) && (privateNames.has(getName) || privateNames.has(setName))) {
                throw path.buildCodeFrameError("Duplicate private field");
              }
              privateNames.add(name);
            }
          }
          if (path.isClassMethod({
            kind: "constructor"
          })) {
            constructor = path;
          } else {
            elements.push(path);
            if (path.isProperty() || path.isPrivate() || path.isStaticBlock != null && path.isStaticBlock()) {
              props.push(path);
            }
          }
        }
        {
          if (!props.length && !isDecorated) return;
        }
        const innerBinding = path.node.id;
        let ref;
        if (!innerBinding || !pathIsClassDeclaration) {
          {
            var _path$ensureFunctionN;
            (_path$ensureFunctionN = path.ensureFunctionName) != null ? _path$ensureFunctionN : path.ensureFunctionName = require("@babel/traverse").NodePath.prototype.ensureFunctionName;
          }
          path.ensureFunctionName(false);
          ref = path.scope.generateUidIdentifier((innerBinding == null ? void 0 : innerBinding.name) || "Class");
        }
        const classRefForDefine = ref != null ? ref : _core.types.cloneNode(innerBinding);
        const privateNamesMap = (0, _fields.buildPrivateNamesMap)(classRefForDefine.name, privateFieldsAsSymbolsOrProperties != null ? privateFieldsAsSymbolsOrProperties : loose, props, file);
        const privateNamesNodes = (0, _fields.buildPrivateNamesNodes)(privateNamesMap, privateFieldsAsProperties != null ? privateFieldsAsProperties : loose, privateFieldsAsSymbols != null ? privateFieldsAsSymbols : false, file);
        (0, _fields.transformPrivateNamesUsage)(classRefForDefine, path, privateNamesMap, {
          privateFieldsAsProperties: privateFieldsAsSymbolsOrProperties != null ? privateFieldsAsSymbolsOrProperties : loose,
          noUninitializedPrivateFieldAccess,
          noDocumentAll,
          innerBinding
        }, file);
        let keysNodes, staticNodes, instanceNodes, lastInstanceNodeReturnsThis, pureStaticNodes, classBindingNode, wrapClass;
        {
          if (isDecorated) {
            staticNodes = pureStaticNodes = keysNodes = [];
            ({
              instanceNodes,
              wrapClass
            } = (0, _decorators2.buildDecoratedClass)(classRefForDefine, path, elements, file));
          } else {
            keysNodes = (0, _misc.extractComputedKeys)(path, computedPaths, file);
            ({
              staticNodes,
              pureStaticNodes,
              instanceNodes,
              lastInstanceNodeReturnsThis,
              classBindingNode,
              wrapClass
            } = (0, _fields.buildFieldsInitNodes)(ref, path.node.superClass, props, privateNamesMap, file, setPublicClassFields != null ? setPublicClassFields : loose, privateFieldsAsSymbolsOrProperties != null ? privateFieldsAsSymbolsOrProperties : loose, noUninitializedPrivateFieldAccess, constantSuper != null ? constantSuper : loose, innerBinding));
          }
        }
        if (instanceNodes.length > 0) {
          (0, _misc.injectInitialization)(path, constructor, instanceNodes, (referenceVisitor, state) => {
            {
              if (isDecorated) return;
            }
            for (const prop of props) {
              if (_core.types.isStaticBlock != null && _core.types.isStaticBlock(prop.node) || prop.node.static) continue;
              prop.traverse(referenceVisitor, state);
            }
          }, lastInstanceNodeReturnsThis);
        }
        const wrappedPath = wrapClass(path);
        wrappedPath.insertBefore([...privateNamesNodes, ...keysNodes]);
        if (staticNodes.length > 0) {
          wrappedPath.insertAfter(staticNodes);
        }
        if (pureStaticNodes.length > 0) {
          wrappedPath.find(parent => parent.isStatement() || parent.isDeclaration()).insertAfter(pureStaticNodes);
        }
        if (classBindingNode != null && pathIsClassDeclaration) {
          wrappedPath.insertAfter(classBindingNode);
        }
      },
      ExportDefaultDeclaration(path, {
        file
      }) {
        {
          if (file.get(versionKey) !== "7.28.3") return;
          const decl = path.get("declaration");
          if (decl.isClassDeclaration() && (0, _decorators.hasDecorators)(decl.node)) {
            if (decl.node.id) {
              {
                var _path$splitExportDecl;
                (_path$splitExportDecl = path.splitExportDeclaration) != null ? _path$splitExportDecl : path.splitExportDeclaration = require("@babel/traverse").NodePath.prototype.splitExportDeclaration;
              }
              path.splitExportDeclaration();
            } else {
              decl.node.type = "ClassExpression";
            }
          }
        }
      }
    }
  };
}

//# sourceMappingURL=index.js.map

}, function(modId) {var map = {"./fields.js":1757467947482,"./decorators.js":1757467947484,"./decorators-2018-09.js":1757467947486,"./misc.js":1757467947485,"./features.js":1757467947487,"./typescript.js":1757467947483}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1757467947482, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildCheckInRHS = buildCheckInRHS;
exports.buildFieldsInitNodes = buildFieldsInitNodes;
exports.buildPrivateNamesMap = buildPrivateNamesMap;
exports.buildPrivateNamesNodes = buildPrivateNamesNodes;
exports.privateNameVisitorFactory = privateNameVisitorFactory;
exports.transformPrivateNamesUsage = transformPrivateNamesUsage;
var _core = require("@babel/core");
var _traverse = require("@babel/traverse");
var _helperReplaceSupers = require("@babel/helper-replace-supers");
var _helperMemberExpressionToFunctions = require("@babel/helper-member-expression-to-functions");
var _helperOptimiseCallExpression = require("@babel/helper-optimise-call-expression");
var _helperAnnotateAsPure = require("@babel/helper-annotate-as-pure");
var _helperSkipTransparentExpressionWrappers = require("@babel/helper-skip-transparent-expression-wrappers");
var ts = require("./typescript.js");
{
  var newHelpers = file => {
    ;
    return file.availableHelper("classPrivateFieldGet2");
  };
}
function buildPrivateNamesMap(className, privateFieldsAsSymbolsOrProperties, props, file) {
  const privateNamesMap = new Map();
  let classBrandId;
  for (const prop of props) {
    if (prop.isPrivate()) {
      const {
        name
      } = prop.node.key.id;
      let update = privateNamesMap.get(name);
      if (!update) {
        const isMethod = !prop.isProperty();
        const isStatic = prop.node.static;
        let initAdded = false;
        let id;
        if (!privateFieldsAsSymbolsOrProperties && newHelpers(file) && isMethod && !isStatic) {
          initAdded = !!classBrandId;
          classBrandId != null ? classBrandId : classBrandId = prop.scope.generateUidIdentifier(`${className}_brand`);
          id = classBrandId;
        } else {
          id = prop.scope.generateUidIdentifier(name);
        }
        update = {
          id,
          static: isStatic,
          method: isMethod,
          initAdded
        };
        privateNamesMap.set(name, update);
      }
      if (prop.isClassPrivateMethod()) {
        if (prop.node.kind === "get") {
          const {
            body
          } = prop.node.body;
          let $;
          if (body.length === 1 && _core.types.isReturnStatement($ = body[0]) && _core.types.isCallExpression($ = $.argument) && $.arguments.length === 1 && _core.types.isThisExpression($.arguments[0]) && _core.types.isIdentifier($ = $.callee)) {
            update.getId = _core.types.cloneNode($);
            update.getterDeclared = true;
          } else {
            update.getId = prop.scope.generateUidIdentifier(`get_${name}`);
          }
        } else if (prop.node.kind === "set") {
          const {
            params
          } = prop.node;
          const {
            body
          } = prop.node.body;
          let $;
          if (body.length === 1 && _core.types.isExpressionStatement($ = body[0]) && _core.types.isCallExpression($ = $.expression) && $.arguments.length === 2 && _core.types.isThisExpression($.arguments[0]) && _core.types.isIdentifier($.arguments[1], {
            name: params[0].name
          }) && _core.types.isIdentifier($ = $.callee)) {
            update.setId = _core.types.cloneNode($);
            update.setterDeclared = true;
          } else {
            update.setId = prop.scope.generateUidIdentifier(`set_${name}`);
          }
        } else if (prop.node.kind === "method") {
          update.methodId = prop.scope.generateUidIdentifier(name);
        }
      }
      privateNamesMap.set(name, update);
    }
  }
  return privateNamesMap;
}
function buildPrivateNamesNodes(privateNamesMap, privateFieldsAsProperties, privateFieldsAsSymbols, state) {
  const initNodes = [];
  const injectedIds = new Set();
  for (const [name, value] of privateNamesMap) {
    const {
      static: isStatic,
      method: isMethod,
      getId,
      setId
    } = value;
    const isGetterOrSetter = getId || setId;
    const id = _core.types.cloneNode(value.id);
    let init;
    if (privateFieldsAsProperties) {
      init = _core.types.callExpression(state.addHelper("classPrivateFieldLooseKey"), [_core.types.stringLiteral(name)]);
    } else if (privateFieldsAsSymbols) {
      init = _core.types.callExpression(_core.types.identifier("Symbol"), [_core.types.stringLiteral(name)]);
    } else if (!isStatic) {
      if (injectedIds.has(id.name)) continue;
      injectedIds.add(id.name);
      init = _core.types.newExpression(_core.types.identifier(isMethod && (!isGetterOrSetter || newHelpers(state)) ? "WeakSet" : "WeakMap"), []);
    }
    if (init) {
      if (!privateFieldsAsSymbols) {
        (0, _helperAnnotateAsPure.default)(init);
      }
      initNodes.push(_core.template.statement.ast`var ${id} = ${init}`);
    }
  }
  return initNodes;
}
function privateNameVisitorFactory(visitor) {
  const nestedVisitor = _traverse.visitors.environmentVisitor(Object.assign({}, visitor));
  const privateNameVisitor = Object.assign({}, visitor, {
    Class(path) {
      const {
        privateNamesMap
      } = this;
      const body = path.get("body.body");
      const visiblePrivateNames = new Map(privateNamesMap);
      const redeclared = [];
      for (const prop of body) {
        if (!prop.isPrivate()) continue;
        const {
          name
        } = prop.node.key.id;
        visiblePrivateNames.delete(name);
        redeclared.push(name);
      }
      if (!redeclared.length) {
        return;
      }
      path.get("body").traverse(nestedVisitor, Object.assign({}, this, {
        redeclared
      }));
      path.traverse(privateNameVisitor, Object.assign({}, this, {
        privateNamesMap: visiblePrivateNames
      }));
      path.skipKey("body");
    }
  });
  return privateNameVisitor;
}
const privateNameVisitor = privateNameVisitorFactory({
  PrivateName(path, {
    noDocumentAll
  }) {
    const {
      privateNamesMap,
      redeclared
    } = this;
    const {
      node,
      parentPath
    } = path;
    if (!parentPath.isMemberExpression({
      property: node
    }) && !parentPath.isOptionalMemberExpression({
      property: node
    })) {
      return;
    }
    const {
      name
    } = node.id;
    if (!privateNamesMap.has(name)) return;
    if (redeclared != null && redeclared.includes(name)) return;
    this.handle(parentPath, noDocumentAll);
  }
});
function unshadow(name, scope, innerBinding) {
  while ((_scope = scope) != null && _scope.hasBinding(name) && !scope.bindingIdentifierEquals(name, innerBinding)) {
    var _scope;
    scope.rename(name);
    scope = scope.parent;
  }
}
function buildCheckInRHS(rhs, file, inRHSIsObject) {
  if (inRHSIsObject || !(file.availableHelper != null && file.availableHelper("checkInRHS"))) return rhs;
  return _core.types.callExpression(file.addHelper("checkInRHS"), [rhs]);
}
const privateInVisitor = privateNameVisitorFactory({
  BinaryExpression(path, {
    file
  }) {
    const {
      operator,
      left,
      right
    } = path.node;
    if (operator !== "in") return;
    if (!_core.types.isPrivateName(left)) return;
    const {
      privateFieldsAsProperties,
      privateNamesMap,
      redeclared
    } = this;
    const {
      name
    } = left.id;
    if (!privateNamesMap.has(name)) return;
    if (redeclared != null && redeclared.includes(name)) return;
    unshadow(this.classRef.name, path.scope, this.innerBinding);
    if (privateFieldsAsProperties) {
      const {
        id
      } = privateNamesMap.get(name);
      path.replaceWith(_core.template.expression.ast`
        Object.prototype.hasOwnProperty.call(${buildCheckInRHS(right, file)}, ${_core.types.cloneNode(id)})
      `);
      return;
    }
    const {
      id,
      static: isStatic
    } = privateNamesMap.get(name);
    if (isStatic) {
      path.replaceWith(_core.template.expression.ast`${buildCheckInRHS(right, file)} === ${_core.types.cloneNode(this.classRef)}`);
      return;
    }
    path.replaceWith(_core.template.expression.ast`${_core.types.cloneNode(id)}.has(${buildCheckInRHS(right, file)})`);
  }
});
function readOnlyError(file, name) {
  return _core.types.callExpression(file.addHelper("readOnlyError"), [_core.types.stringLiteral(`#${name}`)]);
}
function writeOnlyError(file, name) {
  if (!file.availableHelper("writeOnlyError")) {
    console.warn(`@babel/helpers is outdated, update it to silence this warning.`);
    return _core.types.buildUndefinedNode();
  }
  return _core.types.callExpression(file.addHelper("writeOnlyError"), [_core.types.stringLiteral(`#${name}`)]);
}
function buildStaticPrivateFieldAccess(expr, noUninitializedPrivateFieldAccess) {
  if (noUninitializedPrivateFieldAccess) return expr;
  return _core.types.memberExpression(expr, _core.types.identifier("_"));
}
function autoInherits(fn) {
  return function (member) {
    return _core.types.inherits(fn.apply(this, arguments), member.node);
  };
}
const privateNameHandlerSpec = {
  memoise(member, count) {
    const {
      scope
    } = member;
    const {
      object
    } = member.node;
    const memo = scope.maybeGenerateMemoised(object);
    if (!memo) {
      return;
    }
    this.memoiser.set(object, memo, count);
  },
  receiver(member) {
    const {
      object
    } = member.node;
    if (this.memoiser.has(object)) {
      return _core.types.cloneNode(this.memoiser.get(object));
    }
    return _core.types.cloneNode(object);
  },
  get: autoInherits(function (member) {
    const {
      classRef,
      privateNamesMap,
      file,
      innerBinding,
      noUninitializedPrivateFieldAccess
    } = this;
    const privateName = member.node.property;
    const {
      name
    } = privateName.id;
    const {
      id,
      static: isStatic,
      method: isMethod,
      methodId,
      getId,
      setId
    } = privateNamesMap.get(name);
    const isGetterOrSetter = getId || setId;
    const cloneId = id => _core.types.inherits(_core.types.cloneNode(id), privateName);
    if (isStatic) {
      unshadow(classRef.name, member.scope, innerBinding);
      if (!newHelpers(file)) {
        const helperName = isMethod && !isGetterOrSetter ? "classStaticPrivateMethodGet" : "classStaticPrivateFieldSpecGet";
        return _core.types.callExpression(file.addHelper(helperName), [this.receiver(member), _core.types.cloneNode(classRef), cloneId(id)]);
      }
      const receiver = this.receiver(member);
      const skipCheck = _core.types.isIdentifier(receiver) && receiver.name === classRef.name;
      if (!isMethod) {
        if (skipCheck) {
          return buildStaticPrivateFieldAccess(cloneId(id), noUninitializedPrivateFieldAccess);
        }
        return buildStaticPrivateFieldAccess(_core.types.callExpression(file.addHelper("assertClassBrand"), [_core.types.cloneNode(classRef), receiver, cloneId(id)]), noUninitializedPrivateFieldAccess);
      }
      if (getId) {
        if (skipCheck) {
          return _core.types.callExpression(cloneId(getId), [receiver]);
        }
        return _core.types.callExpression(file.addHelper("classPrivateGetter"), [_core.types.cloneNode(classRef), receiver, cloneId(getId)]);
      }
      if (setId) {
        const err = _core.types.buildUndefinedNode();
        if (skipCheck) return err;
        return _core.types.sequenceExpression([_core.types.callExpression(file.addHelper("assertClassBrand"), [_core.types.cloneNode(classRef), receiver]), err]);
      }
      if (skipCheck) return cloneId(id);
      return _core.types.callExpression(file.addHelper("assertClassBrand"), [_core.types.cloneNode(classRef), receiver, cloneId(id)]);
    }
    if (isMethod) {
      if (isGetterOrSetter) {
        if (!getId) {
          return _core.types.sequenceExpression([this.receiver(member), writeOnlyError(file, name)]);
        }
        if (!newHelpers(file)) {
          return _core.types.callExpression(file.addHelper("classPrivateFieldGet"), [this.receiver(member), cloneId(id)]);
        }
        return _core.types.callExpression(file.addHelper("classPrivateGetter"), [_core.types.cloneNode(id), this.receiver(member), cloneId(getId)]);
      }
      if (!newHelpers(file)) {
        return _core.types.callExpression(file.addHelper("classPrivateMethodGet"), [this.receiver(member), _core.types.cloneNode(id), cloneId(methodId)]);
      }
      return _core.types.callExpression(file.addHelper("assertClassBrand"), [_core.types.cloneNode(id), this.receiver(member), cloneId(methodId)]);
    }
    if (newHelpers(file)) {
      return _core.types.callExpression(file.addHelper("classPrivateFieldGet2"), [cloneId(id), this.receiver(member)]);
    }
    return _core.types.callExpression(file.addHelper("classPrivateFieldGet"), [this.receiver(member), cloneId(id)]);
  }),
  boundGet(member) {
    this.memoise(member, 1);
    return _core.types.callExpression(_core.types.memberExpression(this.get(member), _core.types.identifier("bind")), [this.receiver(member)]);
  },
  set: autoInherits(function (member, value) {
    const {
      classRef,
      privateNamesMap,
      file,
      noUninitializedPrivateFieldAccess
    } = this;
    const privateName = member.node.property;
    const {
      name
    } = privateName.id;
    const {
      id,
      static: isStatic,
      method: isMethod,
      setId,
      getId
    } = privateNamesMap.get(name);
    const isGetterOrSetter = getId || setId;
    const cloneId = id => _core.types.inherits(_core.types.cloneNode(id), privateName);
    if (isStatic) {
      if (!newHelpers(file)) {
        const helperName = isMethod && !isGetterOrSetter ? "classStaticPrivateMethodSet" : "classStaticPrivateFieldSpecSet";
        return _core.types.callExpression(file.addHelper(helperName), [this.receiver(member), _core.types.cloneNode(classRef), cloneId(id), value]);
      }
      const receiver = this.receiver(member);
      const skipCheck = _core.types.isIdentifier(receiver) && receiver.name === classRef.name;
      if (isMethod && !setId) {
        const err = readOnlyError(file, name);
        if (skipCheck) return _core.types.sequenceExpression([value, err]);
        return _core.types.sequenceExpression([value, _core.types.callExpression(file.addHelper("assertClassBrand"), [_core.types.cloneNode(classRef), receiver]), readOnlyError(file, name)]);
      }
      if (setId) {
        if (skipCheck) {
          return _core.types.callExpression(_core.types.cloneNode(setId), [receiver, value]);
        }
        return _core.types.callExpression(file.addHelper("classPrivateSetter"), [_core.types.cloneNode(classRef), cloneId(setId), receiver, value]);
      }
      return _core.types.assignmentExpression("=", buildStaticPrivateFieldAccess(cloneId(id), noUninitializedPrivateFieldAccess), skipCheck ? value : _core.types.callExpression(file.addHelper("assertClassBrand"), [_core.types.cloneNode(classRef), receiver, value]));
    }
    if (isMethod) {
      if (setId) {
        if (!newHelpers(file)) {
          return _core.types.callExpression(file.addHelper("classPrivateFieldSet"), [this.receiver(member), cloneId(id), value]);
        }
        return _core.types.callExpression(file.addHelper("classPrivateSetter"), [_core.types.cloneNode(id), cloneId(setId), this.receiver(member), value]);
      }
      return _core.types.sequenceExpression([this.receiver(member), value, readOnlyError(file, name)]);
    }
    if (newHelpers(file)) {
      return _core.types.callExpression(file.addHelper("classPrivateFieldSet2"), [cloneId(id), this.receiver(member), value]);
    }
    return _core.types.callExpression(file.addHelper("classPrivateFieldSet"), [this.receiver(member), cloneId(id), value]);
  }),
  destructureSet(member) {
    const {
      classRef,
      privateNamesMap,
      file,
      noUninitializedPrivateFieldAccess
    } = this;
    const privateName = member.node.property;
    const {
      name
    } = privateName.id;
    const {
      id,
      static: isStatic,
      method: isMethod,
      setId
    } = privateNamesMap.get(name);
    const cloneId = id => _core.types.inherits(_core.types.cloneNode(id), privateName);
    if (!newHelpers(file)) {
      if (isStatic) {
        try {
          var helper = file.addHelper("classStaticPrivateFieldDestructureSet");
        } catch (_unused) {
          throw new Error("Babel can not transpile `[C.#p] = [0]` with @babel/helpers < 7.13.10, \n" + "please update @babel/helpers to the latest version.");
        }
        return _core.types.memberExpression(_core.types.callExpression(helper, [this.receiver(member), _core.types.cloneNode(classRef), cloneId(id)]), _core.types.identifier("value"));
      }
      return _core.types.memberExpression(_core.types.callExpression(file.addHelper("classPrivateFieldDestructureSet"), [this.receiver(member), cloneId(id)]), _core.types.identifier("value"));
    }
    if (isMethod && !setId) {
      return _core.types.memberExpression(_core.types.sequenceExpression([member.node.object, readOnlyError(file, name)]), _core.types.identifier("_"));
    }
    if (isStatic && !isMethod) {
      const getCall = this.get(member);
      if (!noUninitializedPrivateFieldAccess || !_core.types.isCallExpression(getCall)) {
        return getCall;
      }
      const ref = getCall.arguments.pop();
      getCall.arguments.push(_core.template.expression.ast`(_) => ${ref} = _`);
      return _core.types.memberExpression(_core.types.callExpression(file.addHelper("toSetter"), [getCall]), _core.types.identifier("_"));
    }
    const setCall = this.set(member, _core.types.identifier("_"));
    if (!_core.types.isCallExpression(setCall) || !_core.types.isIdentifier(setCall.arguments[setCall.arguments.length - 1], {
      name: "_"
    })) {
      throw member.buildCodeFrameError("Internal Babel error while compiling this code. This is a Babel bug. " + "Please report it at https://github.com/babel/babel/issues.");
    }
    let args;
    if (_core.types.isMemberExpression(setCall.callee, {
      computed: false
    }) && _core.types.isIdentifier(setCall.callee.property) && setCall.callee.property.name === "call") {
      args = [setCall.callee.object, _core.types.arrayExpression(setCall.arguments.slice(1, -1)), setCall.arguments[0]];
    } else {
      args = [setCall.callee, _core.types.arrayExpression(setCall.arguments.slice(0, -1))];
    }
    return _core.types.memberExpression(_core.types.callExpression(file.addHelper("toSetter"), args), _core.types.identifier("_"));
  },
  call(member, args) {
    this.memoise(member, 1);
    return (0, _helperOptimiseCallExpression.default)(this.get(member), this.receiver(member), args, false);
  },
  optionalCall(member, args) {
    this.memoise(member, 1);
    return (0, _helperOptimiseCallExpression.default)(this.get(member), this.receiver(member), args, true);
  },
  delete() {
    throw new Error("Internal Babel error: deleting private elements is a parsing error.");
  }
};
const privateNameHandlerLoose = {
  get(member) {
    const {
      privateNamesMap,
      file
    } = this;
    const {
      object
    } = member.node;
    const {
      name
    } = member.node.property.id;
    return _core.template.expression`BASE(REF, PROP)[PROP]`({
      BASE: file.addHelper("classPrivateFieldLooseBase"),
      REF: _core.types.cloneNode(object),
      PROP: _core.types.cloneNode(privateNamesMap.get(name).id)
    });
  },
  set() {
    throw new Error("private name handler with loose = true don't need set()");
  },
  boundGet(member) {
    return _core.types.callExpression(_core.types.memberExpression(this.get(member), _core.types.identifier("bind")), [_core.types.cloneNode(member.node.object)]);
  },
  simpleSet(member) {
    return this.get(member);
  },
  destructureSet(member) {
    return this.get(member);
  },
  call(member, args) {
    return _core.types.callExpression(this.get(member), args);
  },
  optionalCall(member, args) {
    return _core.types.optionalCallExpression(this.get(member), args, true);
  },
  delete() {
    throw new Error("Internal Babel error: deleting private elements is a parsing error.");
  }
};
function transformPrivateNamesUsage(ref, path, privateNamesMap, {
  privateFieldsAsProperties,
  noUninitializedPrivateFieldAccess,
  noDocumentAll,
  innerBinding
}, state) {
  if (!privateNamesMap.size) return;
  const body = path.get("body");
  const handler = privateFieldsAsProperties ? privateNameHandlerLoose : privateNameHandlerSpec;
  (0, _helperMemberExpressionToFunctions.default)(body, privateNameVisitor, Object.assign({
    privateNamesMap,
    classRef: ref,
    file: state
  }, handler, {
    noDocumentAll,
    noUninitializedPrivateFieldAccess,
    innerBinding
  }));
  body.traverse(privateInVisitor, {
    privateNamesMap,
    classRef: ref,
    file: state,
    privateFieldsAsProperties,
    innerBinding
  });
}
function buildPrivateFieldInitLoose(ref, prop, privateNamesMap) {
  const {
    id
  } = privateNamesMap.get(prop.node.key.id.name);
  const value = prop.node.value || prop.scope.buildUndefinedNode();
  return inheritPropComments(_core.template.statement.ast`
      Object.defineProperty(${ref}, ${_core.types.cloneNode(id)}, {
        // configurable is false by default
        // enumerable is false by default
        writable: true,
        value: ${value}
      });
    `, prop);
}
function buildPrivateInstanceFieldInitSpec(ref, prop, privateNamesMap, state) {
  const {
    id
  } = privateNamesMap.get(prop.node.key.id.name);
  const value = prop.node.value || prop.scope.buildUndefinedNode();
  {
    if (!state.availableHelper("classPrivateFieldInitSpec")) {
      return inheritPropComments(_core.template.statement.ast`${_core.types.cloneNode(id)}.set(${ref}, {
          // configurable is always false for private elements
          // enumerable is always false for private elements
          writable: true,
          value: ${value},
        })`, prop);
    }
  }
  const helper = state.addHelper("classPrivateFieldInitSpec");
  return inheritLoc(inheritPropComments(_core.types.expressionStatement(_core.types.callExpression(helper, [_core.types.thisExpression(), inheritLoc(_core.types.cloneNode(id), prop.node.key), newHelpers(state) ? value : _core.template.expression.ast`{ writable: true, value: ${value} }`])), prop), prop.node);
}
function buildPrivateStaticFieldInitSpec(prop, privateNamesMap, noUninitializedPrivateFieldAccess) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  const value = noUninitializedPrivateFieldAccess ? prop.node.value : _core.template.expression.ast`{
        _: ${prop.node.value || _core.types.buildUndefinedNode()}
      }`;
  return inheritPropComments(_core.types.variableDeclaration("var", [_core.types.variableDeclarator(_core.types.cloneNode(privateName.id), value)]), prop);
}
{
  var buildPrivateStaticFieldInitSpecOld = function (prop, privateNamesMap) {
    const privateName = privateNamesMap.get(prop.node.key.id.name);
    const {
      id,
      getId,
      setId,
      initAdded
    } = privateName;
    const isGetterOrSetter = getId || setId;
    if (!prop.isProperty() && (initAdded || !isGetterOrSetter)) return;
    if (isGetterOrSetter) {
      privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
        initAdded: true
      }));
      return inheritPropComments(_core.template.statement.ast`
          var ${_core.types.cloneNode(id)} = {
            // configurable is false by default
            // enumerable is false by default
            // writable is false by default
            get: ${getId ? getId.name : prop.scope.buildUndefinedNode()},
            set: ${setId ? setId.name : prop.scope.buildUndefinedNode()}
          }
        `, prop);
    }
    const value = prop.node.value || prop.scope.buildUndefinedNode();
    return inheritPropComments(_core.template.statement.ast`
        var ${_core.types.cloneNode(id)} = {
          // configurable is false by default
          // enumerable is false by default
          writable: true,
          value: ${value}
        };
      `, prop);
  };
}
function buildPrivateMethodInitLoose(ref, prop, privateNamesMap) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  const {
    methodId,
    id,
    getId,
    setId,
    initAdded
  } = privateName;
  if (initAdded) return;
  if (methodId) {
    return inheritPropComments(_core.template.statement.ast`
        Object.defineProperty(${ref}, ${id}, {
          // configurable is false by default
          // enumerable is false by default
          // writable is false by default
          value: ${methodId.name}
        });
      `, prop);
  }
  const isGetterOrSetter = getId || setId;
  if (isGetterOrSetter) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      initAdded: true
    }));
    return inheritPropComments(_core.template.statement.ast`
        Object.defineProperty(${ref}, ${id}, {
          // configurable is false by default
          // enumerable is false by default
          // writable is false by default
          get: ${getId ? getId.name : prop.scope.buildUndefinedNode()},
          set: ${setId ? setId.name : prop.scope.buildUndefinedNode()}
        });
      `, prop);
  }
}
function buildPrivateInstanceMethodInitSpec(ref, prop, privateNamesMap, state) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  if (privateName.initAdded) return;
  if (!newHelpers(state)) {
    const isGetterOrSetter = privateName.getId || privateName.setId;
    if (isGetterOrSetter) {
      return buildPrivateAccessorInitialization(ref, prop, privateNamesMap, state);
    }
  }
  return buildPrivateInstanceMethodInitialization(ref, prop, privateNamesMap, state);
}
function buildPrivateAccessorInitialization(ref, prop, privateNamesMap, state) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  const {
    id,
    getId,
    setId
  } = privateName;
  privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
    initAdded: true
  }));
  {
    if (!state.availableHelper("classPrivateFieldInitSpec")) {
      return inheritPropComments(_core.template.statement.ast`
          ${id}.set(${ref}, {
            get: ${getId ? getId.name : prop.scope.buildUndefinedNode()},
            set: ${setId ? setId.name : prop.scope.buildUndefinedNode()}
          });
        `, prop);
    }
  }
  const helper = state.addHelper("classPrivateFieldInitSpec");
  return inheritLoc(inheritPropComments(_core.template.statement.ast`${helper}(
      ${_core.types.thisExpression()},
      ${_core.types.cloneNode(id)},
      {
        get: ${getId ? getId.name : prop.scope.buildUndefinedNode()},
        set: ${setId ? setId.name : prop.scope.buildUndefinedNode()}
      },
    )`, prop), prop.node);
}
function buildPrivateInstanceMethodInitialization(ref, prop, privateNamesMap, state) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  const {
    id
  } = privateName;
  {
    if (!state.availableHelper("classPrivateMethodInitSpec")) {
      return inheritPropComments(_core.template.statement.ast`${id}.add(${ref})`, prop);
    }
  }
  const helper = state.addHelper("classPrivateMethodInitSpec");
  return inheritPropComments(_core.template.statement.ast`${helper}(
      ${_core.types.thisExpression()},
      ${_core.types.cloneNode(id)}
    )`, prop);
}
function buildPublicFieldInitLoose(ref, prop) {
  const {
    key,
    computed
  } = prop.node;
  const value = prop.node.value || prop.scope.buildUndefinedNode();
  return inheritPropComments(_core.types.expressionStatement(_core.types.assignmentExpression("=", _core.types.memberExpression(ref, key, computed || _core.types.isLiteral(key)), value)), prop);
}
function buildPublicFieldInitSpec(ref, prop, state) {
  const {
    key,
    computed
  } = prop.node;
  const value = prop.node.value || prop.scope.buildUndefinedNode();
  return inheritPropComments(_core.types.expressionStatement(_core.types.callExpression(state.addHelper("defineProperty"), [ref, computed || _core.types.isLiteral(key) ? key : _core.types.stringLiteral(key.name), value])), prop);
}
function buildPrivateStaticMethodInitLoose(ref, prop, state, privateNamesMap) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  const {
    id,
    methodId,
    getId,
    setId,
    initAdded
  } = privateName;
  if (initAdded) return;
  const isGetterOrSetter = getId || setId;
  if (isGetterOrSetter) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      initAdded: true
    }));
    return inheritPropComments(_core.template.statement.ast`
        Object.defineProperty(${ref}, ${id}, {
          // configurable is false by default
          // enumerable is false by default
          // writable is false by default
          get: ${getId ? getId.name : prop.scope.buildUndefinedNode()},
          set: ${setId ? setId.name : prop.scope.buildUndefinedNode()}
        })
      `, prop);
  }
  return inheritPropComments(_core.template.statement.ast`
      Object.defineProperty(${ref}, ${id}, {
        // configurable is false by default
        // enumerable is false by default
        // writable is false by default
        value: ${methodId.name}
      });
    `, prop);
}
function buildPrivateMethodDeclaration(file, prop, privateNamesMap, privateFieldsAsSymbolsOrProperties = false) {
  const privateName = privateNamesMap.get(prop.node.key.id.name);
  const {
    id,
    methodId,
    getId,
    setId,
    getterDeclared,
    setterDeclared,
    static: isStatic
  } = privateName;
  const {
    params,
    body,
    generator,
    async
  } = prop.node;
  const isGetter = getId && params.length === 0;
  const isSetter = setId && params.length > 0;
  if (isGetter && getterDeclared || isSetter && setterDeclared) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      initAdded: true
    }));
    return null;
  }
  if (newHelpers(file) && (isGetter || isSetter) && !privateFieldsAsSymbolsOrProperties) {
    const scope = prop.get("body").scope;
    const thisArg = scope.generateUidIdentifier("this");
    const state = {
      thisRef: thisArg,
      argumentsPath: []
    };
    prop.traverse(thisContextVisitor, state);
    if (state.argumentsPath.length) {
      const argumentsId = scope.generateUidIdentifier("arguments");
      scope.push({
        id: argumentsId,
        init: _core.template.expression.ast`[].slice.call(arguments, 1)`
      });
      for (const path of state.argumentsPath) {
        path.replaceWith(_core.types.cloneNode(argumentsId));
      }
    }
    params.unshift(_core.types.cloneNode(thisArg));
  }
  let declId = methodId;
  if (isGetter) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      getterDeclared: true,
      initAdded: true
    }));
    declId = getId;
  } else if (isSetter) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      setterDeclared: true,
      initAdded: true
    }));
    declId = setId;
  } else if (isStatic && !privateFieldsAsSymbolsOrProperties) {
    declId = id;
  }
  return inheritPropComments(_core.types.functionDeclaration(_core.types.cloneNode(declId), params, body, generator, async), prop);
}
const thisContextVisitor = _traverse.visitors.environmentVisitor({
  Identifier(path, state) {
    if (state.argumentsPath && path.node.name === "arguments") {
      state.argumentsPath.push(path);
    }
  },
  UnaryExpression(path) {
    const {
      node
    } = path;
    if (node.operator === "delete") {
      const argument = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrapperNodes)(node.argument);
      if (_core.types.isThisExpression(argument)) {
        path.replaceWith(_core.types.booleanLiteral(true));
      }
    }
  },
  ThisExpression(path, state) {
    state.needsClassRef = true;
    path.replaceWith(_core.types.cloneNode(state.thisRef));
  },
  MetaProperty(path) {
    const {
      node,
      scope
    } = path;
    if (node.meta.name === "new" && node.property.name === "target") {
      path.replaceWith(scope.buildUndefinedNode());
    }
  }
});
const innerReferencesVisitor = {
  ReferencedIdentifier(path, state) {
    if (path.scope.bindingIdentifierEquals(path.node.name, state.innerBinding)) {
      state.needsClassRef = true;
      path.node.name = state.thisRef.name;
    }
  }
};
function replaceThisContext(path, ref, innerBindingRef) {
  var _state$thisRef;
  const state = {
    thisRef: ref,
    needsClassRef: false,
    innerBinding: innerBindingRef
  };
  if (!path.isMethod()) {
    path.traverse(thisContextVisitor, state);
  }
  if (innerBindingRef != null && (_state$thisRef = state.thisRef) != null && _state$thisRef.name && state.thisRef.name !== innerBindingRef.name) {
    path.traverse(innerReferencesVisitor, state);
  }
  return state.needsClassRef;
}
function isNameOrLength({
  key,
  computed
}) {
  if (key.type === "Identifier") {
    return !computed && (key.name === "name" || key.name === "length");
  }
  if (key.type === "StringLiteral") {
    return key.value === "name" || key.value === "length";
  }
  return false;
}
function inheritPropComments(node, prop) {
  _core.types.inheritLeadingComments(node, prop.node);
  _core.types.inheritInnerComments(node, prop.node);
  return node;
}
function inheritLoc(node, original) {
  node.start = original.start;
  node.end = original.end;
  node.loc = original.loc;
  return node;
}
function buildFieldsInitNodes(ref, superRef, props, privateNamesMap, file, setPublicClassFields, privateFieldsAsSymbolsOrProperties, noUninitializedPrivateFieldAccess, constantSuper, innerBindingRef) {
  let classRefFlags = 0;
  let injectSuperRef;
  const staticNodes = [];
  const instanceNodes = [];
  let lastInstanceNodeReturnsThis = false;
  const pureStaticNodes = [];
  let classBindingNode = null;
  const getSuperRef = _core.types.isIdentifier(superRef) ? () => superRef : () => {
    injectSuperRef != null ? injectSuperRef : injectSuperRef = props[0].scope.generateUidIdentifierBasedOnNode(superRef);
    return injectSuperRef;
  };
  const classRefForInnerBinding = ref != null ? ref : props[0].scope.generateUidIdentifier((innerBindingRef == null ? void 0 : innerBindingRef.name) || "Class");
  ref != null ? ref : ref = _core.types.cloneNode(innerBindingRef);
  for (const prop of props) {
    if (prop.isClassProperty()) {
      ts.assertFieldTransformed(prop);
    }
    const isStatic = !(_core.types.isStaticBlock != null && _core.types.isStaticBlock(prop.node)) && prop.node.static;
    const isInstance = !isStatic;
    const isPrivate = prop.isPrivate();
    const isPublic = !isPrivate;
    const isField = prop.isProperty();
    const isMethod = !isField;
    const isStaticBlock = prop.isStaticBlock == null ? void 0 : prop.isStaticBlock();
    if (isStatic) classRefFlags |= 1;
    if (isStatic || isMethod && isPrivate || isStaticBlock) {
      new _helperReplaceSupers.default({
        methodPath: prop,
        constantSuper,
        file: file,
        refToPreserve: innerBindingRef,
        getSuperRef,
        getObjectRef() {
          classRefFlags |= 2;
          if (isStatic || isStaticBlock) {
            return classRefForInnerBinding;
          } else {
            return _core.types.memberExpression(classRefForInnerBinding, _core.types.identifier("prototype"));
          }
        }
      }).replace();
      const replaced = replaceThisContext(prop, classRefForInnerBinding, innerBindingRef);
      if (replaced) {
        classRefFlags |= 2;
      }
    }
    lastInstanceNodeReturnsThis = false;
    switch (true) {
      case isStaticBlock:
        {
          const blockBody = prop.node.body;
          if (blockBody.length === 1 && _core.types.isExpressionStatement(blockBody[0])) {
            staticNodes.push(inheritPropComments(blockBody[0], prop));
          } else {
            staticNodes.push(_core.types.inheritsComments(_core.template.statement.ast`(() => { ${blockBody} })()`, prop.node));
          }
          break;
        }
      case isStatic && isPrivate && isField && privateFieldsAsSymbolsOrProperties:
        staticNodes.push(buildPrivateFieldInitLoose(_core.types.cloneNode(ref), prop, privateNamesMap));
        break;
      case isStatic && isPrivate && isField && !privateFieldsAsSymbolsOrProperties:
        if (!newHelpers(file)) {
          staticNodes.push(buildPrivateStaticFieldInitSpecOld(prop, privateNamesMap));
        } else {
          staticNodes.push(buildPrivateStaticFieldInitSpec(prop, privateNamesMap, noUninitializedPrivateFieldAccess));
        }
        break;
      case isStatic && isPublic && isField && setPublicClassFields:
        if (!isNameOrLength(prop.node)) {
          staticNodes.push(buildPublicFieldInitLoose(_core.types.cloneNode(ref), prop));
          break;
        }
      case isStatic && isPublic && isField && !setPublicClassFields:
        staticNodes.push(buildPublicFieldInitSpec(_core.types.cloneNode(ref), prop, file));
        break;
      case isInstance && isPrivate && isField && privateFieldsAsSymbolsOrProperties:
        instanceNodes.push(buildPrivateFieldInitLoose(_core.types.thisExpression(), prop, privateNamesMap));
        break;
      case isInstance && isPrivate && isField && !privateFieldsAsSymbolsOrProperties:
        instanceNodes.push(buildPrivateInstanceFieldInitSpec(_core.types.thisExpression(), prop, privateNamesMap, file));
        break;
      case isInstance && isPrivate && isMethod && privateFieldsAsSymbolsOrProperties:
        instanceNodes.unshift(buildPrivateMethodInitLoose(_core.types.thisExpression(), prop, privateNamesMap));
        pureStaticNodes.push(buildPrivateMethodDeclaration(file, prop, privateNamesMap, privateFieldsAsSymbolsOrProperties));
        break;
      case isInstance && isPrivate && isMethod && !privateFieldsAsSymbolsOrProperties:
        instanceNodes.unshift(buildPrivateInstanceMethodInitSpec(_core.types.thisExpression(), prop, privateNamesMap, file));
        pureStaticNodes.push(buildPrivateMethodDeclaration(file, prop, privateNamesMap, privateFieldsAsSymbolsOrProperties));
        break;
      case isStatic && isPrivate && isMethod && !privateFieldsAsSymbolsOrProperties:
        if (!newHelpers(file)) {
          staticNodes.unshift(buildPrivateStaticFieldInitSpecOld(prop, privateNamesMap));
        }
        pureStaticNodes.push(buildPrivateMethodDeclaration(file, prop, privateNamesMap, privateFieldsAsSymbolsOrProperties));
        break;
      case isStatic && isPrivate && isMethod && privateFieldsAsSymbolsOrProperties:
        staticNodes.unshift(buildPrivateStaticMethodInitLoose(_core.types.cloneNode(ref), prop, file, privateNamesMap));
        pureStaticNodes.push(buildPrivateMethodDeclaration(file, prop, privateNamesMap, privateFieldsAsSymbolsOrProperties));
        break;
      case isInstance && isPublic && isField && setPublicClassFields:
        instanceNodes.push(buildPublicFieldInitLoose(_core.types.thisExpression(), prop));
        break;
      case isInstance && isPublic && isField && !setPublicClassFields:
        lastInstanceNodeReturnsThis = true;
        instanceNodes.push(buildPublicFieldInitSpec(_core.types.thisExpression(), prop, file));
        break;
      default:
        throw new Error("Unreachable.");
    }
  }
  if (classRefFlags & 2 && innerBindingRef != null) {
    classBindingNode = _core.types.expressionStatement(_core.types.assignmentExpression("=", _core.types.cloneNode(classRefForInnerBinding), _core.types.cloneNode(innerBindingRef)));
  }
  return {
    staticNodes: staticNodes.filter(Boolean),
    instanceNodes: instanceNodes.filter(Boolean),
    lastInstanceNodeReturnsThis,
    pureStaticNodes: pureStaticNodes.filter(Boolean),
    classBindingNode,
    wrapClass(path) {
      for (const prop of props) {
        prop.node.leadingComments = null;
        prop.remove();
      }
      if (injectSuperRef) {
        path.scope.push({
          id: _core.types.cloneNode(injectSuperRef)
        });
        path.set("superClass", _core.types.assignmentExpression("=", injectSuperRef, path.node.superClass));
      }
      if (classRefFlags !== 0) {
        if (path.isClassExpression()) {
          path.scope.push({
            id: ref
          });
          path.replaceWith(_core.types.assignmentExpression("=", _core.types.cloneNode(ref), path.node));
        } else {
          if (innerBindingRef == null) {
            path.node.id = ref;
          }
          if (classBindingNode != null) {
            path.scope.push({
              id: classRefForInnerBinding
            });
          }
        }
      }
      return path;
    }
  };
}

//# sourceMappingURL=fields.js.map

}, function(modId) { var map = {"./typescript.js":1757467947483}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1757467947483, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertFieldTransformed = assertFieldTransformed;
function assertFieldTransformed(path) {
  if (path.node.declare || false) {
    throw path.buildCodeFrameError(`TypeScript 'declare' fields must first be transformed by ` + `@babel/plugin-transform-typescript.\n` + `If you have already enabled that plugin (or '@babel/preset-typescript'), make sure ` + `that it runs before any plugin related to additional class features:\n` + ` - @babel/plugin-transform-class-properties\n` + ` - @babel/plugin-transform-private-methods\n` + ` - @babel/plugin-proposal-decorators`);
  }
}

//# sourceMappingURL=typescript.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1757467947484, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildNamedEvaluationVisitor = buildNamedEvaluationVisitor;
exports.default = _default;
exports.hasDecorators = hasDecorators;
exports.hasOwnDecorators = hasOwnDecorators;
var _core = require("@babel/core");
var _helperReplaceSupers = require("@babel/helper-replace-supers");
var _helperSkipTransparentExpressionWrappers = require("@babel/helper-skip-transparent-expression-wrappers");
var _fields = require("./fields.js");
var _misc = require("./misc.js");
function hasOwnDecorators(node) {
  var _node$decorators;
  return !!((_node$decorators = node.decorators) != null && _node$decorators.length);
}
function hasDecorators(node) {
  return hasOwnDecorators(node) || node.body.body.some(hasOwnDecorators);
}
function incrementId(id, idx = id.length - 1) {
  if (idx === -1) {
    id.unshift(65);
    return;
  }
  const current = id[idx];
  if (current === 90) {
    id[idx] = 97;
  } else if (current === 122) {
    id[idx] = 65;
    incrementId(id, idx - 1);
  } else {
    id[idx] = current + 1;
  }
}
function createPrivateUidGeneratorForClass(classPath) {
  const currentPrivateId = [];
  const privateNames = new Set();
  classPath.traverse({
    PrivateName(path) {
      privateNames.add(path.node.id.name);
    }
  });
  return () => {
    let reifiedId;
    do {
      incrementId(currentPrivateId);
      reifiedId = String.fromCharCode(...currentPrivateId);
    } while (privateNames.has(reifiedId));
    return _core.types.privateName(_core.types.identifier(reifiedId));
  };
}
function createLazyPrivateUidGeneratorForClass(classPath) {
  let generator;
  return () => {
    if (!generator) {
      generator = createPrivateUidGeneratorForClass(classPath);
    }
    return generator();
  };
}
function replaceClassWithVar(path, className) {
  const id = path.node.id;
  const scope = path.scope;
  if (path.type === "ClassDeclaration") {
    const className = id.name;
    const varId = scope.generateUidIdentifierBasedOnNode(id);
    const classId = _core.types.identifier(className);
    scope.rename(className, varId.name);
    path.get("id").replaceWith(classId);
    return {
      id: _core.types.cloneNode(varId),
      path
    };
  } else {
    let varId;
    if (id) {
      className = id.name;
      varId = generateLetUidIdentifier(scope.parent, className);
      scope.rename(className, varId.name);
    } else {
      varId = generateLetUidIdentifier(scope.parent, typeof className === "string" ? className : "decorated_class");
    }
    const newClassExpr = _core.types.classExpression(typeof className === "string" ? _core.types.identifier(className) : null, path.node.superClass, path.node.body);
    const [newPath] = path.replaceWith(_core.types.sequenceExpression([newClassExpr, varId]));
    return {
      id: _core.types.cloneNode(varId),
      path: newPath.get("expressions.0")
    };
  }
}
function generateClassProperty(key, value, isStatic) {
  if (key.type === "PrivateName") {
    return _core.types.classPrivateProperty(key, value, undefined, isStatic);
  } else {
    return _core.types.classProperty(key, value, undefined, undefined, isStatic);
  }
}
function assignIdForAnonymousClass(path, className) {
  if (!path.node.id) {
    path.node.id = typeof className === "string" ? _core.types.identifier(className) : path.scope.generateUidIdentifier("Class");
  }
}
function addProxyAccessorsFor(className, element, getterKey, setterKey, targetKey, isComputed, isStatic, version) {
  const thisArg = (version === "2023-11" || version === "2023-05") && isStatic ? className : _core.types.thisExpression();
  const getterBody = _core.types.blockStatement([_core.types.returnStatement(_core.types.memberExpression(_core.types.cloneNode(thisArg), _core.types.cloneNode(targetKey)))]);
  const setterBody = _core.types.blockStatement([_core.types.expressionStatement(_core.types.assignmentExpression("=", _core.types.memberExpression(_core.types.cloneNode(thisArg), _core.types.cloneNode(targetKey)), _core.types.identifier("v")))]);
  let getter, setter;
  if (getterKey.type === "PrivateName") {
    getter = _core.types.classPrivateMethod("get", getterKey, [], getterBody, isStatic);
    setter = _core.types.classPrivateMethod("set", setterKey, [_core.types.identifier("v")], setterBody, isStatic);
  } else {
    getter = _core.types.classMethod("get", getterKey, [], getterBody, isComputed, isStatic);
    setter = _core.types.classMethod("set", setterKey, [_core.types.identifier("v")], setterBody, isComputed, isStatic);
  }
  element.insertAfter(setter);
  element.insertAfter(getter);
}
function extractProxyAccessorsFor(targetKey, version) {
  if (version !== "2023-11" && version !== "2023-05" && version !== "2023-01") {
    return [_core.template.expression.ast`
        function () {
          return this.${_core.types.cloneNode(targetKey)};
        }
      `, _core.template.expression.ast`
        function (value) {
          this.${_core.types.cloneNode(targetKey)} = value;
        }
      `];
  }
  return [_core.template.expression.ast`
      o => o.${_core.types.cloneNode(targetKey)}
    `, _core.template.expression.ast`
      (o, v) => o.${_core.types.cloneNode(targetKey)} = v
    `];
}
function getComputedKeyLastElement(path) {
  path = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path);
  if (path.isSequenceExpression()) {
    const expressions = path.get("expressions");
    return getComputedKeyLastElement(expressions[expressions.length - 1]);
  }
  return path;
}
function getComputedKeyMemoiser(path) {
  const element = getComputedKeyLastElement(path);
  if (element.isConstantExpression()) {
    return _core.types.cloneNode(path.node);
  } else if (element.isIdentifier() && path.scope.hasUid(element.node.name)) {
    return _core.types.cloneNode(path.node);
  } else if (element.isAssignmentExpression() && element.get("left").isIdentifier()) {
    return _core.types.cloneNode(element.node.left);
  } else {
    throw new Error(`Internal Error: the computed key ${path.toString()} has not yet been memoised.`);
  }
}
function prependExpressionsToComputedKey(expressions, fieldPath) {
  const key = fieldPath.get("key");
  if (key.isSequenceExpression()) {
    expressions.push(...key.node.expressions);
  } else {
    expressions.push(key.node);
  }
  key.replaceWith(maybeSequenceExpression(expressions));
}
function appendExpressionsToComputedKey(expressions, fieldPath) {
  const key = fieldPath.get("key");
  const completion = getComputedKeyLastElement(key);
  if (completion.isConstantExpression()) {
    prependExpressionsToComputedKey(expressions, fieldPath);
  } else {
    const scopeParent = key.scope.parent;
    const maybeAssignment = (0, _misc.memoiseComputedKey)(completion.node, scopeParent, scopeParent.generateUid("computedKey"));
    if (!maybeAssignment) {
      prependExpressionsToComputedKey(expressions, fieldPath);
    } else {
      const expressionSequence = [...expressions, _core.types.cloneNode(maybeAssignment.left)];
      const completionParent = completion.parentPath;
      if (completionParent.isSequenceExpression()) {
        completionParent.pushContainer("expressions", expressionSequence);
      } else {
        completion.replaceWith(maybeSequenceExpression([_core.types.cloneNode(maybeAssignment), ...expressionSequence]));
      }
    }
  }
}
function prependExpressionsToFieldInitializer(expressions, fieldPath) {
  const initializer = fieldPath.get("value");
  if (initializer.node) {
    expressions.push(initializer.node);
  } else if (expressions.length > 0) {
    expressions[expressions.length - 1] = _core.types.unaryExpression("void", expressions[expressions.length - 1]);
  }
  initializer.replaceWith(maybeSequenceExpression(expressions));
}
function prependExpressionsToStaticBlock(expressions, blockPath) {
  blockPath.unshiftContainer("body", _core.types.expressionStatement(maybeSequenceExpression(expressions)));
}
function prependExpressionsToConstructor(expressions, constructorPath) {
  constructorPath.node.body.body.unshift(_core.types.expressionStatement(maybeSequenceExpression(expressions)));
}
function isProtoInitCallExpression(expression, protoInitCall) {
  return _core.types.isCallExpression(expression) && _core.types.isIdentifier(expression.callee, {
    name: protoInitCall.name
  });
}
function optimizeSuperCallAndExpressions(expressions, protoInitLocal) {
  if (protoInitLocal) {
    if (expressions.length >= 2 && isProtoInitCallExpression(expressions[1], protoInitLocal)) {
      const mergedSuperCall = _core.types.callExpression(_core.types.cloneNode(protoInitLocal), [expressions[0]]);
      expressions.splice(0, 2, mergedSuperCall);
    }
    if (expressions.length >= 2 && _core.types.isThisExpression(expressions[expressions.length - 1]) && isProtoInitCallExpression(expressions[expressions.length - 2], protoInitLocal)) {
      expressions.splice(expressions.length - 1, 1);
    }
  }
  return maybeSequenceExpression(expressions);
}
function insertExpressionsAfterSuperCallAndOptimize(expressions, constructorPath, protoInitLocal) {
  constructorPath.traverse({
    CallExpression: {
      exit(path) {
        if (!path.get("callee").isSuper()) return;
        const newNodes = [path.node, ...expressions.map(expr => _core.types.cloneNode(expr))];
        if (path.isCompletionRecord()) {
          newNodes.push(_core.types.thisExpression());
        }
        path.replaceWith(optimizeSuperCallAndExpressions(newNodes, protoInitLocal));
        path.skip();
      }
    },
    ClassMethod(path) {
      if (path.node.kind === "constructor") {
        path.skip();
      }
    }
  });
}
function createConstructorFromExpressions(expressions, isDerivedClass) {
  const body = [_core.types.expressionStatement(maybeSequenceExpression(expressions))];
  if (isDerivedClass) {
    body.unshift(_core.types.expressionStatement(_core.types.callExpression(_core.types.super(), [_core.types.spreadElement(_core.types.identifier("args"))])));
  }
  return _core.types.classMethod("constructor", _core.types.identifier("constructor"), isDerivedClass ? [_core.types.restElement(_core.types.identifier("args"))] : [], _core.types.blockStatement(body));
}
function createStaticBlockFromExpressions(expressions) {
  return _core.types.staticBlock([_core.types.expressionStatement(maybeSequenceExpression(expressions))]);
}
const FIELD = 0;
const ACCESSOR = 1;
const METHOD = 2;
const GETTER = 3;
const SETTER = 4;
const STATIC_OLD_VERSION = 5;
const STATIC = 8;
const DECORATORS_HAVE_THIS = 16;
function getElementKind(element) {
  switch (element.node.type) {
    case "ClassProperty":
    case "ClassPrivateProperty":
      return FIELD;
    case "ClassAccessorProperty":
      return ACCESSOR;
    case "ClassMethod":
    case "ClassPrivateMethod":
      if (element.node.kind === "get") {
        return GETTER;
      } else if (element.node.kind === "set") {
        return SETTER;
      } else {
        return METHOD;
      }
  }
}
function toSortedDecoratorInfo(info) {
  return [...info.filter(el => el.isStatic && el.kind >= ACCESSOR && el.kind <= SETTER), ...info.filter(el => !el.isStatic && el.kind >= ACCESSOR && el.kind <= SETTER), ...info.filter(el => el.isStatic && el.kind === FIELD), ...info.filter(el => !el.isStatic && el.kind === FIELD)];
}
function generateDecorationList(decorators, decoratorsThis, version) {
  const decsCount = decorators.length;
  const haveOneThis = decoratorsThis.some(Boolean);
  const decs = [];
  for (let i = 0; i < decsCount; i++) {
    if ((version === "2023-11" || version === "2023-05") && haveOneThis) {
      decs.push(decoratorsThis[i] || _core.types.unaryExpression("void", _core.types.numericLiteral(0)));
    }
    decs.push(decorators[i].expression);
  }
  return {
    haveThis: haveOneThis,
    decs
  };
}
function generateDecorationExprs(decorationInfo, version) {
  return _core.types.arrayExpression(decorationInfo.map(el => {
    let flag = el.kind;
    if (el.isStatic) {
      flag += version === "2023-11" || version === "2023-05" ? STATIC : STATIC_OLD_VERSION;
    }
    if (el.decoratorsHaveThis) flag += DECORATORS_HAVE_THIS;
    return _core.types.arrayExpression([el.decoratorsArray, _core.types.numericLiteral(flag), el.name, ...(el.privateMethods || [])]);
  }));
}
function extractElementLocalAssignments(decorationInfo) {
  const localIds = [];
  for (const el of decorationInfo) {
    const {
      locals
    } = el;
    if (Array.isArray(locals)) {
      localIds.push(...locals);
    } else if (locals !== undefined) {
      localIds.push(locals);
    }
  }
  return localIds;
}
function addCallAccessorsFor(version, element, key, getId, setId, isStatic) {
  element.insertAfter(_core.types.classPrivateMethod("get", _core.types.cloneNode(key), [], _core.types.blockStatement([_core.types.returnStatement(_core.types.callExpression(_core.types.cloneNode(getId), version === "2023-11" && isStatic ? [] : [_core.types.thisExpression()]))]), isStatic));
  element.insertAfter(_core.types.classPrivateMethod("set", _core.types.cloneNode(key), [_core.types.identifier("v")], _core.types.blockStatement([_core.types.expressionStatement(_core.types.callExpression(_core.types.cloneNode(setId), version === "2023-11" && isStatic ? [_core.types.identifier("v")] : [_core.types.thisExpression(), _core.types.identifier("v")]))]), isStatic));
}
function movePrivateAccessor(element, key, methodLocalVar, isStatic) {
  let params;
  let block;
  if (element.node.kind === "set") {
    params = [_core.types.identifier("v")];
    block = [_core.types.expressionStatement(_core.types.callExpression(methodLocalVar, [_core.types.thisExpression(), _core.types.identifier("v")]))];
  } else {
    params = [];
    block = [_core.types.returnStatement(_core.types.callExpression(methodLocalVar, [_core.types.thisExpression()]))];
  }
  element.replaceWith(_core.types.classPrivateMethod(element.node.kind, _core.types.cloneNode(key), params, _core.types.blockStatement(block), isStatic));
}
function isClassDecoratableElementPath(path) {
  const {
    type
  } = path;
  return type !== "TSDeclareMethod" && type !== "TSIndexSignature" && type !== "StaticBlock";
}
function staticBlockToIIFE(block) {
  return _core.types.callExpression(_core.types.arrowFunctionExpression([], _core.types.blockStatement(block.body)), []);
}
function staticBlockToFunctionClosure(block) {
  return _core.types.functionExpression(null, [], _core.types.blockStatement(block.body));
}
function fieldInitializerToClosure(value) {
  return _core.types.functionExpression(null, [], _core.types.blockStatement([_core.types.returnStatement(value)]));
}
function maybeSequenceExpression(exprs) {
  if (exprs.length === 0) return _core.types.unaryExpression("void", _core.types.numericLiteral(0));
  if (exprs.length === 1) return exprs[0];
  return _core.types.sequenceExpression(exprs);
}
function createFunctionExpressionFromPrivateMethod(node) {
  const {
    params,
    body,
    generator: isGenerator,
    async: isAsync
  } = node;
  return _core.types.functionExpression(undefined, params, body, isGenerator, isAsync);
}
function createSetFunctionNameCall(state, className) {
  return _core.types.callExpression(state.addHelper("setFunctionName"), [_core.types.thisExpression(), className]);
}
function createToPropertyKeyCall(state, propertyKey) {
  return _core.types.callExpression(state.addHelper("toPropertyKey"), [propertyKey]);
}
function createPrivateBrandCheckClosure(brandName) {
  return _core.types.arrowFunctionExpression([_core.types.identifier("_")], _core.types.binaryExpression("in", _core.types.cloneNode(brandName), _core.types.identifier("_")));
}
function usesPrivateField(expression) {
  {
    try {
      _core.types.traverseFast(expression, node => {
        if (_core.types.isPrivateName(node)) {
          throw null;
        }
      });
      return false;
    } catch (_unused) {
      return true;
    }
  }
}
function convertToComputedKey(path) {
  const {
    node
  } = path;
  node.computed = true;
  if (_core.types.isIdentifier(node.key)) {
    node.key = _core.types.stringLiteral(node.key.name);
  }
}
function hasInstancePrivateAccess(path, privateNames) {
  let containsInstancePrivateAccess = false;
  if (privateNames.length > 0) {
    const privateNameVisitor = (0, _fields.privateNameVisitorFactory)({
      PrivateName(path, state) {
        if (state.privateNamesMap.has(path.node.id.name)) {
          containsInstancePrivateAccess = true;
          path.stop();
        }
      }
    });
    const privateNamesMap = new Map();
    for (const name of privateNames) {
      privateNamesMap.set(name, null);
    }
    path.traverse(privateNameVisitor, {
      privateNamesMap: privateNamesMap
    });
  }
  return containsInstancePrivateAccess;
}
function checkPrivateMethodUpdateError(path, decoratedPrivateMethods) {
  const privateNameVisitor = (0, _fields.privateNameVisitorFactory)({
    PrivateName(path, state) {
      if (!state.privateNamesMap.has(path.node.id.name)) return;
      const parentPath = path.parentPath;
      const parentParentPath = parentPath.parentPath;
      if (parentParentPath.node.type === "AssignmentExpression" && parentParentPath.node.left === parentPath.node || parentParentPath.node.type === "UpdateExpression" || parentParentPath.node.type === "RestElement" || parentParentPath.node.type === "ArrayPattern" || parentParentPath.node.type === "ObjectProperty" && parentParentPath.node.value === parentPath.node && parentParentPath.parentPath.type === "ObjectPattern" || parentParentPath.node.type === "ForOfStatement" && parentParentPath.node.left === parentPath.node) {
        throw path.buildCodeFrameError(`Decorated private methods are read-only, but "#${path.node.id.name}" is updated via this expression.`);
      }
    }
  });
  const privateNamesMap = new Map();
  for (const name of decoratedPrivateMethods) {
    privateNamesMap.set(name, null);
  }
  path.traverse(privateNameVisitor, {
    privateNamesMap: privateNamesMap
  });
}
function transformClass(path, state, constantSuper, ignoreFunctionLength, className, propertyVisitor, version) {
  var _path$node$id;
  const body = path.get("body.body");
  const classDecorators = path.node.decorators;
  let hasElementDecorators = false;
  let hasComputedKeysSideEffects = false;
  let elemDecsUseFnContext = false;
  const generateClassPrivateUid = createLazyPrivateUidGeneratorForClass(path);
  const classAssignments = [];
  const scopeParent = path.scope.parent;
  const memoiseExpression = (expression, hint, assignments) => {
    const localEvaluatedId = generateLetUidIdentifier(scopeParent, hint);
    assignments.push(_core.types.assignmentExpression("=", localEvaluatedId, expression));
    return _core.types.cloneNode(localEvaluatedId);
  };
  let protoInitLocal;
  let staticInitLocal;
  const classIdName = (_path$node$id = path.node.id) == null ? void 0 : _path$node$id.name;
  const setClassName = typeof className === "object" ? className : undefined;
  const usesFunctionContextOrYieldAwait = decorator => {
    {
      try {
        _core.types.traverseFast(decorator, node => {
          if (_core.types.isThisExpression(node) || _core.types.isSuper(node) || _core.types.isYieldExpression(node) || _core.types.isAwaitExpression(node) || _core.types.isIdentifier(node, {
            name: "arguments"
          }) || classIdName && _core.types.isIdentifier(node, {
            name: classIdName
          }) || _core.types.isMetaProperty(node) && node.meta.name !== "import") {
            throw null;
          }
        });
        return false;
      } catch (_unused2) {
        return true;
      }
    }
  };
  const instancePrivateNames = [];
  for (const element of body) {
    if (!isClassDecoratableElementPath(element)) {
      continue;
    }
    const elementNode = element.node;
    if (!elementNode.static && _core.types.isPrivateName(elementNode.key)) {
      instancePrivateNames.push(elementNode.key.id.name);
    }
    if (isDecorated(elementNode)) {
      switch (elementNode.type) {
        case "ClassProperty":
          propertyVisitor.ClassProperty(element, state);
          break;
        case "ClassPrivateProperty":
          propertyVisitor.ClassPrivateProperty(element, state);
          break;
        case "ClassAccessorProperty":
          propertyVisitor.ClassAccessorProperty(element, state);
          if (version === "2023-11") {
            break;
          }
        default:
          if (elementNode.static) {
            staticInitLocal != null ? staticInitLocal : staticInitLocal = generateLetUidIdentifier(scopeParent, "initStatic");
          } else {
            protoInitLocal != null ? protoInitLocal : protoInitLocal = generateLetUidIdentifier(scopeParent, "initProto");
          }
          break;
      }
      hasElementDecorators = true;
      elemDecsUseFnContext || (elemDecsUseFnContext = elementNode.decorators.some(usesFunctionContextOrYieldAwait));
    } else if (elementNode.type === "ClassAccessorProperty") {
      propertyVisitor.ClassAccessorProperty(element, state);
      const {
        key,
        value,
        static: isStatic,
        computed
      } = elementNode;
      const newId = generateClassPrivateUid();
      const newField = generateClassProperty(newId, value, isStatic);
      const keyPath = element.get("key");
      const [newPath] = element.replaceWith(newField);
      let getterKey, setterKey;
      if (computed && !keyPath.isConstantExpression()) {
        getterKey = (0, _misc.memoiseComputedKey)(createToPropertyKeyCall(state, key), scopeParent, scopeParent.generateUid("computedKey"));
        setterKey = _core.types.cloneNode(getterKey.left);
      } else {
        getterKey = _core.types.cloneNode(key);
        setterKey = _core.types.cloneNode(key);
      }
      assignIdForAnonymousClass(path, className);
      addProxyAccessorsFor(path.node.id, newPath, getterKey, setterKey, newId, computed, isStatic, version);
    }
    if ("computed" in element.node && element.node.computed) {
      hasComputedKeysSideEffects || (hasComputedKeysSideEffects = !scopeParent.isStatic(element.node.key));
    }
  }
  if (!classDecorators && !hasElementDecorators) {
    if (!path.node.id && typeof className === "string") {
      path.node.id = _core.types.identifier(className);
    }
    if (setClassName) {
      path.node.body.body.unshift(createStaticBlockFromExpressions([createSetFunctionNameCall(state, setClassName)]));
    }
    return;
  }
  const elementDecoratorInfo = [];
  let constructorPath;
  const decoratedPrivateMethods = new Set();
  let classInitLocal, classIdLocal;
  let decoratorReceiverId = null;
  function handleDecorators(decorators) {
    let hasSideEffects = false;
    let usesFnContext = false;
    const decoratorsThis = [];
    for (const decorator of decorators) {
      const {
        expression
      } = decorator;
      let object;
      if ((version === "2023-11" || version === "2023-05") && _core.types.isMemberExpression(expression)) {
        if (_core.types.isSuper(expression.object)) {
          object = _core.types.thisExpression();
        } else if (scopeParent.isStatic(expression.object)) {
          object = _core.types.cloneNode(expression.object);
        } else {
          decoratorReceiverId != null ? decoratorReceiverId : decoratorReceiverId = generateLetUidIdentifier(scopeParent, "obj");
          object = _core.types.assignmentExpression("=", _core.types.cloneNode(decoratorReceiverId), expression.object);
          expression.object = _core.types.cloneNode(decoratorReceiverId);
        }
      }
      decoratorsThis.push(object);
      hasSideEffects || (hasSideEffects = !scopeParent.isStatic(expression));
      usesFnContext || (usesFnContext = usesFunctionContextOrYieldAwait(decorator));
    }
    return {
      hasSideEffects,
      usesFnContext,
      decoratorsThis
    };
  }
  const willExtractSomeElemDecs = hasComputedKeysSideEffects || elemDecsUseFnContext || version !== "2023-11";
  let needsDeclarationForClassBinding = false;
  let classDecorationsFlag = 0;
  let classDecorations = [];
  let classDecorationsId;
  let computedKeyAssignments = [];
  if (classDecorators) {
    classInitLocal = generateLetUidIdentifier(scopeParent, "initClass");
    needsDeclarationForClassBinding = path.isClassDeclaration();
    ({
      id: classIdLocal,
      path
    } = replaceClassWithVar(path, className));
    path.node.decorators = null;
    const classDecsUsePrivateName = classDecorators.some(usesPrivateField);
    const {
      hasSideEffects,
      usesFnContext,
      decoratorsThis
    } = handleDecorators(classDecorators);
    const {
      haveThis,
      decs
    } = generateDecorationList(classDecorators, decoratorsThis, version);
    classDecorationsFlag = haveThis ? 1 : 0;
    classDecorations = decs;
    if (usesFnContext || hasSideEffects && willExtractSomeElemDecs || classDecsUsePrivateName) {
      classDecorationsId = memoiseExpression(_core.types.arrayExpression(classDecorations), "classDecs", classAssignments);
    }
    if (!hasElementDecorators) {
      for (const element of path.get("body.body")) {
        const {
          node
        } = element;
        const isComputed = "computed" in node && node.computed;
        if (isComputed) {
          if (element.isClassProperty({
            static: true
          })) {
            if (!element.get("key").isConstantExpression()) {
              const key = node.key;
              const maybeAssignment = (0, _misc.memoiseComputedKey)(key, scopeParent, scopeParent.generateUid("computedKey"));
              if (maybeAssignment != null) {
                node.key = _core.types.cloneNode(maybeAssignment.left);
                computedKeyAssignments.push(maybeAssignment);
              }
            }
          } else if (computedKeyAssignments.length > 0) {
            prependExpressionsToComputedKey(computedKeyAssignments, element);
            computedKeyAssignments = [];
          }
        }
      }
    }
  } else {
    assignIdForAnonymousClass(path, className);
    classIdLocal = _core.types.cloneNode(path.node.id);
  }
  let lastInstancePrivateName;
  let needsInstancePrivateBrandCheck = false;
  let fieldInitializerExpressions = [];
  let staticFieldInitializerExpressions = [];
  if (hasElementDecorators) {
    if (protoInitLocal) {
      const protoInitCall = _core.types.callExpression(_core.types.cloneNode(protoInitLocal), [_core.types.thisExpression()]);
      fieldInitializerExpressions.push(protoInitCall);
    }
    for (const element of body) {
      if (!isClassDecoratableElementPath(element)) {
        if (staticFieldInitializerExpressions.length > 0 && element.isStaticBlock()) {
          prependExpressionsToStaticBlock(staticFieldInitializerExpressions, element);
          staticFieldInitializerExpressions = [];
        }
        continue;
      }
      const {
        node
      } = element;
      const decorators = node.decorators;
      const hasDecorators = !!(decorators != null && decorators.length);
      const isComputed = "computed" in node && node.computed;
      let name = "computedKey";
      if (node.key.type === "PrivateName") {
        name = node.key.id.name;
      } else if (!isComputed && node.key.type === "Identifier") {
        name = node.key.name;
      }
      let decoratorsArray;
      let decoratorsHaveThis;
      if (hasDecorators) {
        const {
          hasSideEffects,
          usesFnContext,
          decoratorsThis
        } = handleDecorators(decorators);
        const {
          decs,
          haveThis
        } = generateDecorationList(decorators, decoratorsThis, version);
        decoratorsHaveThis = haveThis;
        decoratorsArray = decs.length === 1 ? decs[0] : _core.types.arrayExpression(decs);
        if (usesFnContext || hasSideEffects && willExtractSomeElemDecs) {
          decoratorsArray = memoiseExpression(decoratorsArray, name + "Decs", computedKeyAssignments);
        }
      }
      if (isComputed) {
        if (!element.get("key").isConstantExpression()) {
          const key = node.key;
          const maybeAssignment = (0, _misc.memoiseComputedKey)(hasDecorators ? createToPropertyKeyCall(state, key) : key, scopeParent, scopeParent.generateUid("computedKey"));
          if (maybeAssignment != null) {
            if (classDecorators && element.isClassProperty({
              static: true
            })) {
              node.key = _core.types.cloneNode(maybeAssignment.left);
              computedKeyAssignments.push(maybeAssignment);
            } else {
              node.key = maybeAssignment;
            }
          }
        }
      }
      const {
        key,
        static: isStatic
      } = node;
      const isPrivate = key.type === "PrivateName";
      const kind = getElementKind(element);
      if (isPrivate && !isStatic) {
        if (hasDecorators) {
          needsInstancePrivateBrandCheck = true;
        }
        if (_core.types.isClassPrivateProperty(node) || !lastInstancePrivateName) {
          lastInstancePrivateName = key;
        }
      }
      if (element.isClassMethod({
        kind: "constructor"
      })) {
        constructorPath = element;
      }
      let locals;
      if (hasDecorators) {
        let privateMethods;
        let nameExpr;
        if (isComputed) {
          nameExpr = getComputedKeyMemoiser(element.get("key"));
        } else if (key.type === "PrivateName") {
          nameExpr = _core.types.stringLiteral(key.id.name);
        } else if (key.type === "Identifier") {
          nameExpr = _core.types.stringLiteral(key.name);
        } else {
          nameExpr = _core.types.cloneNode(key);
        }
        if (kind === ACCESSOR) {
          const {
            value
          } = element.node;
          const params = version === "2023-11" && isStatic ? [] : [_core.types.thisExpression()];
          if (value) {
            params.push(_core.types.cloneNode(value));
          }
          const newId = generateClassPrivateUid();
          const newFieldInitId = generateLetUidIdentifier(scopeParent, `init_${name}`);
          const newValue = _core.types.callExpression(_core.types.cloneNode(newFieldInitId), params);
          const newField = generateClassProperty(newId, newValue, isStatic);
          const [newPath] = element.replaceWith(newField);
          if (isPrivate) {
            privateMethods = extractProxyAccessorsFor(newId, version);
            const getId = generateLetUidIdentifier(scopeParent, `get_${name}`);
            const setId = generateLetUidIdentifier(scopeParent, `set_${name}`);
            addCallAccessorsFor(version, newPath, key, getId, setId, isStatic);
            locals = [newFieldInitId, getId, setId];
          } else {
            assignIdForAnonymousClass(path, className);
            addProxyAccessorsFor(path.node.id, newPath, _core.types.cloneNode(key), _core.types.isAssignmentExpression(key) ? _core.types.cloneNode(key.left) : _core.types.cloneNode(key), newId, isComputed, isStatic, version);
            locals = [newFieldInitId];
          }
        } else if (kind === FIELD) {
          const initId = generateLetUidIdentifier(scopeParent, `init_${name}`);
          const valuePath = element.get("value");
          const args = version === "2023-11" && isStatic ? [] : [_core.types.thisExpression()];
          if (valuePath.node) args.push(valuePath.node);
          valuePath.replaceWith(_core.types.callExpression(_core.types.cloneNode(initId), args));
          locals = [initId];
          if (isPrivate) {
            privateMethods = extractProxyAccessorsFor(key, version);
          }
        } else if (isPrivate) {
          const callId = generateLetUidIdentifier(scopeParent, `call_${name}`);
          locals = [callId];
          const replaceSupers = new _helperReplaceSupers.default({
            constantSuper,
            methodPath: element,
            objectRef: classIdLocal,
            superRef: path.node.superClass,
            file: state.file,
            refToPreserve: classIdLocal
          });
          replaceSupers.replace();
          privateMethods = [createFunctionExpressionFromPrivateMethod(element.node)];
          if (kind === GETTER || kind === SETTER) {
            movePrivateAccessor(element, _core.types.cloneNode(key), _core.types.cloneNode(callId), isStatic);
          } else {
            const node = element.node;
            path.node.body.body.unshift(_core.types.classPrivateProperty(key, _core.types.cloneNode(callId), [], node.static));
            decoratedPrivateMethods.add(key.id.name);
            element.remove();
          }
        }
        elementDecoratorInfo.push({
          kind,
          decoratorsArray,
          decoratorsHaveThis,
          name: nameExpr,
          isStatic,
          privateMethods,
          locals
        });
        if (element.node) {
          element.node.decorators = null;
        }
      }
      if (isComputed && computedKeyAssignments.length > 0) {
        if (classDecorators && element.isClassProperty({
          static: true
        })) {} else {
          prependExpressionsToComputedKey(computedKeyAssignments, kind === ACCESSOR ? element.getNextSibling() : element);
          computedKeyAssignments = [];
        }
      }
      if (fieldInitializerExpressions.length > 0 && !isStatic && (kind === FIELD || kind === ACCESSOR)) {
        prependExpressionsToFieldInitializer(fieldInitializerExpressions, element);
        fieldInitializerExpressions = [];
      }
      if (staticFieldInitializerExpressions.length > 0 && isStatic && (kind === FIELD || kind === ACCESSOR)) {
        prependExpressionsToFieldInitializer(staticFieldInitializerExpressions, element);
        staticFieldInitializerExpressions = [];
      }
      if (hasDecorators && version === "2023-11") {
        if (kind === FIELD || kind === ACCESSOR) {
          const initExtraId = generateLetUidIdentifier(scopeParent, `init_extra_${name}`);
          locals.push(initExtraId);
          const initExtraCall = _core.types.callExpression(_core.types.cloneNode(initExtraId), isStatic ? [] : [_core.types.thisExpression()]);
          if (!isStatic) {
            fieldInitializerExpressions.push(initExtraCall);
          } else {
            staticFieldInitializerExpressions.push(initExtraCall);
          }
        }
      }
    }
  }
  if (computedKeyAssignments.length > 0) {
    const elements = path.get("body.body");
    let lastComputedElement;
    for (let i = elements.length - 1; i >= 0; i--) {
      const path = elements[i];
      const node = path.node;
      if (node.computed) {
        if (classDecorators && _core.types.isClassProperty(node, {
          static: true
        })) {
          continue;
        }
        lastComputedElement = path;
        break;
      }
    }
    if (lastComputedElement != null) {
      appendExpressionsToComputedKey(computedKeyAssignments, lastComputedElement);
      computedKeyAssignments = [];
    } else {}
  }
  if (fieldInitializerExpressions.length > 0) {
    const isDerivedClass = !!path.node.superClass;
    if (constructorPath) {
      if (isDerivedClass) {
        insertExpressionsAfterSuperCallAndOptimize(fieldInitializerExpressions, constructorPath, protoInitLocal);
      } else {
        prependExpressionsToConstructor(fieldInitializerExpressions, constructorPath);
      }
    } else {
      path.node.body.body.unshift(createConstructorFromExpressions(fieldInitializerExpressions, isDerivedClass));
    }
    fieldInitializerExpressions = [];
  }
  if (staticFieldInitializerExpressions.length > 0) {
    path.node.body.body.push(createStaticBlockFromExpressions(staticFieldInitializerExpressions));
    staticFieldInitializerExpressions = [];
  }
  const sortedElementDecoratorInfo = toSortedDecoratorInfo(elementDecoratorInfo);
  const elementDecorations = generateDecorationExprs(version === "2023-11" ? elementDecoratorInfo : sortedElementDecoratorInfo, version);
  const elementLocals = extractElementLocalAssignments(sortedElementDecoratorInfo);
  if (protoInitLocal) {
    elementLocals.push(protoInitLocal);
  }
  if (staticInitLocal) {
    elementLocals.push(staticInitLocal);
  }
  const classLocals = [];
  let classInitInjected = false;
  const classInitCall = classInitLocal && _core.types.callExpression(_core.types.cloneNode(classInitLocal), []);
  let originalClassPath = path;
  const originalClass = path.node;
  const staticClosures = [];
  if (classDecorators) {
    classLocals.push(classIdLocal, classInitLocal);
    const statics = [];
    path.get("body.body").forEach(element => {
      if (element.isStaticBlock()) {
        if (hasInstancePrivateAccess(element, instancePrivateNames)) {
          const staticBlockClosureId = memoiseExpression(staticBlockToFunctionClosure(element.node), "staticBlock", staticClosures);
          staticFieldInitializerExpressions.push(_core.types.callExpression(_core.types.memberExpression(staticBlockClosureId, _core.types.identifier("call")), [_core.types.thisExpression()]));
        } else {
          staticFieldInitializerExpressions.push(staticBlockToIIFE(element.node));
        }
        element.remove();
        return;
      }
      if ((element.isClassProperty() || element.isClassPrivateProperty()) && element.node.static) {
        const valuePath = element.get("value");
        if (hasInstancePrivateAccess(valuePath, instancePrivateNames)) {
          const fieldValueClosureId = memoiseExpression(fieldInitializerToClosure(valuePath.node), "fieldValue", staticClosures);
          valuePath.replaceWith(_core.types.callExpression(_core.types.memberExpression(fieldValueClosureId, _core.types.identifier("call")), [_core.types.thisExpression()]));
        }
        if (staticFieldInitializerExpressions.length > 0) {
          prependExpressionsToFieldInitializer(staticFieldInitializerExpressions, element);
          staticFieldInitializerExpressions = [];
        }
        element.node.static = false;
        statics.push(element.node);
        element.remove();
      } else if (element.isClassPrivateMethod({
        static: true
      })) {
        if (hasInstancePrivateAccess(element, instancePrivateNames)) {
          const replaceSupers = new _helperReplaceSupers.default({
            constantSuper,
            methodPath: element,
            objectRef: classIdLocal,
            superRef: path.node.superClass,
            file: state.file,
            refToPreserve: classIdLocal
          });
          replaceSupers.replace();
          const privateMethodDelegateId = memoiseExpression(createFunctionExpressionFromPrivateMethod(element.node), element.get("key.id").node.name, staticClosures);
          if (ignoreFunctionLength) {
            element.node.params = [_core.types.restElement(_core.types.identifier("arg"))];
            element.node.body = _core.types.blockStatement([_core.types.returnStatement(_core.types.callExpression(_core.types.memberExpression(privateMethodDelegateId, _core.types.identifier("apply")), [_core.types.thisExpression(), _core.types.identifier("arg")]))]);
          } else {
            element.node.params = element.node.params.map((p, i) => {
              if (_core.types.isRestElement(p)) {
                return _core.types.restElement(_core.types.identifier("arg"));
              } else {
                return _core.types.identifier("_" + i);
              }
            });
            element.node.body = _core.types.blockStatement([_core.types.returnStatement(_core.types.callExpression(_core.types.memberExpression(privateMethodDelegateId, _core.types.identifier("apply")), [_core.types.thisExpression(), _core.types.identifier("arguments")]))]);
          }
        }
        element.node.static = false;
        statics.push(element.node);
        element.remove();
      }
    });
    if (statics.length > 0 || staticFieldInitializerExpressions.length > 0) {
      const staticsClass = _core.template.expression.ast`
        class extends ${state.addHelper("identity")} {}
      `;
      staticsClass.body.body = [_core.types.classProperty(_core.types.toExpression(originalClass), undefined, undefined, undefined, true, true), ...statics];
      const constructorBody = [];
      const newExpr = _core.types.newExpression(staticsClass, []);
      if (staticFieldInitializerExpressions.length > 0) {
        constructorBody.push(...staticFieldInitializerExpressions);
      }
      if (classInitCall) {
        classInitInjected = true;
        constructorBody.push(classInitCall);
      }
      if (constructorBody.length > 0) {
        constructorBody.unshift(_core.types.callExpression(_core.types.super(), [_core.types.cloneNode(classIdLocal)]));
        staticsClass.body.body.push(createConstructorFromExpressions(constructorBody, false));
      } else {
        newExpr.arguments.push(_core.types.cloneNode(classIdLocal));
      }
      const [newPath] = path.replaceWith(newExpr);
      originalClassPath = newPath.get("callee").get("body").get("body.0.key");
    }
  }
  if (!classInitInjected && classInitCall) {
    path.node.body.body.push(_core.types.staticBlock([_core.types.expressionStatement(classInitCall)]));
  }
  let {
    superClass
  } = originalClass;
  if (superClass && (version === "2023-11" || version === "2023-05")) {
    const id = path.scope.maybeGenerateMemoised(superClass);
    if (id) {
      originalClass.superClass = _core.types.assignmentExpression("=", id, superClass);
      superClass = id;
    }
  }
  const applyDecoratorWrapper = _core.types.staticBlock([]);
  originalClass.body.body.unshift(applyDecoratorWrapper);
  const applyDecsBody = applyDecoratorWrapper.body;
  if (computedKeyAssignments.length > 0) {
    const elements = originalClassPath.get("body.body");
    let firstPublicElement;
    for (const path of elements) {
      if ((path.isClassProperty() || path.isClassMethod()) && path.node.kind !== "constructor") {
        firstPublicElement = path;
        break;
      }
    }
    if (firstPublicElement != null) {
      convertToComputedKey(firstPublicElement);
      prependExpressionsToComputedKey(computedKeyAssignments, firstPublicElement);
    } else {
      originalClass.body.body.unshift(_core.types.classProperty(_core.types.sequenceExpression([...computedKeyAssignments, _core.types.stringLiteral("_")]), undefined, undefined, undefined, true, true));
      applyDecsBody.push(_core.types.expressionStatement(_core.types.unaryExpression("delete", _core.types.memberExpression(_core.types.thisExpression(), _core.types.identifier("_")))));
    }
    computedKeyAssignments = [];
  }
  applyDecsBody.push(_core.types.expressionStatement(createLocalsAssignment(elementLocals, classLocals, elementDecorations, classDecorationsId != null ? classDecorationsId : _core.types.arrayExpression(classDecorations), _core.types.numericLiteral(classDecorationsFlag), needsInstancePrivateBrandCheck ? lastInstancePrivateName : null, setClassName, _core.types.cloneNode(superClass), state, version)));
  if (staticInitLocal) {
    applyDecsBody.push(_core.types.expressionStatement(_core.types.callExpression(_core.types.cloneNode(staticInitLocal), [_core.types.thisExpression()])));
  }
  if (staticClosures.length > 0) {
    applyDecsBody.push(...staticClosures.map(expr => _core.types.expressionStatement(expr)));
  }
  path.insertBefore(classAssignments.map(expr => _core.types.expressionStatement(expr)));
  if (needsDeclarationForClassBinding) {
    const classBindingInfo = scopeParent.getBinding(classIdLocal.name);
    if (!classBindingInfo.constantViolations.length) {
      path.insertBefore(_core.types.variableDeclaration("let", [_core.types.variableDeclarator(_core.types.cloneNode(classIdLocal))]));
    } else {
      const classOuterBindingDelegateLocal = scopeParent.generateUidIdentifier("t" + classIdLocal.name);
      const classOuterBindingLocal = classIdLocal;
      path.replaceWithMultiple([_core.types.variableDeclaration("let", [_core.types.variableDeclarator(_core.types.cloneNode(classOuterBindingLocal)), _core.types.variableDeclarator(classOuterBindingDelegateLocal)]), _core.types.blockStatement([_core.types.variableDeclaration("let", [_core.types.variableDeclarator(_core.types.cloneNode(classIdLocal))]), path.node, _core.types.expressionStatement(_core.types.assignmentExpression("=", _core.types.cloneNode(classOuterBindingDelegateLocal), _core.types.cloneNode(classIdLocal)))]), _core.types.expressionStatement(_core.types.assignmentExpression("=", _core.types.cloneNode(classOuterBindingLocal), _core.types.cloneNode(classOuterBindingDelegateLocal)))]);
    }
  }
  if (decoratedPrivateMethods.size > 0) {
    checkPrivateMethodUpdateError(path, decoratedPrivateMethods);
  }
  path.scope.crawl();
  return path;
}
function createLocalsAssignment(elementLocals, classLocals, elementDecorations, classDecorations, classDecorationsFlag, maybePrivateBrandName, setClassName, superClass, state, version) {
  let lhs, rhs;
  const args = [setClassName ? createSetFunctionNameCall(state, setClassName) : _core.types.thisExpression(), classDecorations, elementDecorations];
  {
    if (version !== "2023-11") {
      args.splice(1, 2, elementDecorations, classDecorations);
    }
    if (version === "2021-12" || version === "2022-03" && !state.availableHelper("applyDecs2203R")) {
      lhs = _core.types.arrayPattern([...elementLocals, ...classLocals]);
      rhs = _core.types.callExpression(state.addHelper(version === "2021-12" ? "applyDecs" : "applyDecs2203"), args);
      return _core.types.assignmentExpression("=", lhs, rhs);
    } else if (version === "2022-03") {
      rhs = _core.types.callExpression(state.addHelper("applyDecs2203R"), args);
    } else if (version === "2023-01") {
      if (maybePrivateBrandName) {
        args.push(createPrivateBrandCheckClosure(maybePrivateBrandName));
      }
      rhs = _core.types.callExpression(state.addHelper("applyDecs2301"), args);
    } else if (version === "2023-05") {
      if (maybePrivateBrandName || superClass || classDecorationsFlag.value !== 0) {
        args.push(classDecorationsFlag);
      }
      if (maybePrivateBrandName) {
        args.push(createPrivateBrandCheckClosure(maybePrivateBrandName));
      } else if (superClass) {
        args.push(_core.types.unaryExpression("void", _core.types.numericLiteral(0)));
      }
      if (superClass) args.push(superClass);
      rhs = _core.types.callExpression(state.addHelper("applyDecs2305"), args);
    }
  }
  if (version === "2023-11") {
    if (maybePrivateBrandName || superClass || classDecorationsFlag.value !== 0) {
      args.push(classDecorationsFlag);
    }
    if (maybePrivateBrandName) {
      args.push(createPrivateBrandCheckClosure(maybePrivateBrandName));
    } else if (superClass) {
      args.push(_core.types.unaryExpression("void", _core.types.numericLiteral(0)));
    }
    if (superClass) args.push(superClass);
    rhs = _core.types.callExpression(state.addHelper("applyDecs2311"), args);
  }
  if (elementLocals.length > 0) {
    if (classLocals.length > 0) {
      lhs = _core.types.objectPattern([_core.types.objectProperty(_core.types.identifier("e"), _core.types.arrayPattern(elementLocals)), _core.types.objectProperty(_core.types.identifier("c"), _core.types.arrayPattern(classLocals))]);
    } else {
      lhs = _core.types.arrayPattern(elementLocals);
      rhs = _core.types.memberExpression(rhs, _core.types.identifier("e"), false, false);
    }
  } else {
    lhs = _core.types.arrayPattern(classLocals);
    rhs = _core.types.memberExpression(rhs, _core.types.identifier("c"), false, false);
  }
  return _core.types.assignmentExpression("=", lhs, rhs);
}
function isProtoKey(node) {
  return node.type === "Identifier" ? node.name === "__proto__" : node.value === "__proto__";
}
function isDecorated(node) {
  return node.decorators && node.decorators.length > 0;
}
function shouldTransformElement(node) {
  switch (node.type) {
    case "ClassAccessorProperty":
      return true;
    case "ClassMethod":
    case "ClassProperty":
    case "ClassPrivateMethod":
    case "ClassPrivateProperty":
      return isDecorated(node);
    default:
      return false;
  }
}
function shouldTransformClass(node) {
  return isDecorated(node) || node.body.body.some(shouldTransformElement);
}
function buildNamedEvaluationVisitor(needsName, visitor) {
  function handleComputedProperty(propertyPath, key, state) {
    switch (key.type) {
      case "StringLiteral":
        return _core.types.stringLiteral(key.value);
      case "NumericLiteral":
      case "BigIntLiteral":
        {
          const keyValue = key.value + "";
          propertyPath.get("key").replaceWith(_core.types.stringLiteral(keyValue));
          return _core.types.stringLiteral(keyValue);
        }
      default:
        {
          const ref = propertyPath.scope.maybeGenerateMemoised(key);
          propertyPath.get("key").replaceWith(_core.types.assignmentExpression("=", ref, createToPropertyKeyCall(state, key)));
          return _core.types.cloneNode(ref);
        }
    }
  }
  return {
    VariableDeclarator(path, state) {
      const id = path.node.id;
      if (id.type === "Identifier") {
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("init"));
        if (needsName(initializer)) {
          const name = id.name;
          visitor(initializer, state, name);
        }
      }
    },
    AssignmentExpression(path, state) {
      const id = path.node.left;
      if (id.type === "Identifier") {
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("right"));
        if (needsName(initializer)) {
          switch (path.node.operator) {
            case "=":
            case "&&=":
            case "||=":
            case "??=":
              visitor(initializer, state, id.name);
          }
        }
      }
    },
    AssignmentPattern(path, state) {
      const id = path.node.left;
      if (id.type === "Identifier") {
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("right"));
        if (needsName(initializer)) {
          const name = id.name;
          visitor(initializer, state, name);
        }
      }
    },
    ObjectExpression(path, state) {
      for (const propertyPath of path.get("properties")) {
        if (!propertyPath.isObjectProperty()) continue;
        const {
          node
        } = propertyPath;
        const id = node.key;
        const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(propertyPath.get("value"));
        if (needsName(initializer)) {
          if (!node.computed) {
            if (!isProtoKey(id)) {
              if (id.type === "Identifier") {
                visitor(initializer, state, id.name);
              } else {
                const className = _core.types.stringLiteral(id.value + "");
                visitor(initializer, state, className);
              }
            }
          } else {
            const ref = handleComputedProperty(propertyPath, id, state);
            visitor(initializer, state, ref);
          }
        }
      }
    },
    ClassPrivateProperty(path, state) {
      const {
        node
      } = path;
      const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("value"));
      if (needsName(initializer)) {
        const className = _core.types.stringLiteral("#" + node.key.id.name);
        visitor(initializer, state, className);
      }
    },
    ClassAccessorProperty(path, state) {
      const {
        node
      } = path;
      const id = node.key;
      const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("value"));
      if (needsName(initializer)) {
        if (!node.computed) {
          if (id.type === "Identifier") {
            visitor(initializer, state, id.name);
          } else if (id.type === "PrivateName") {
            const className = _core.types.stringLiteral("#" + id.id.name);
            visitor(initializer, state, className);
          } else {
            const className = _core.types.stringLiteral(id.value + "");
            visitor(initializer, state, className);
          }
        } else {
          const ref = handleComputedProperty(path, id, state);
          visitor(initializer, state, ref);
        }
      }
    },
    ClassProperty(path, state) {
      const {
        node
      } = path;
      const id = node.key;
      const initializer = (0, _helperSkipTransparentExpressionWrappers.skipTransparentExprWrappers)(path.get("value"));
      if (needsName(initializer)) {
        if (!node.computed) {
          if (id.type === "Identifier") {
            visitor(initializer, state, id.name);
          } else {
            const className = _core.types.stringLiteral(id.value + "");
            visitor(initializer, state, className);
          }
        } else {
          const ref = handleComputedProperty(path, id, state);
          visitor(initializer, state, ref);
        }
      }
    }
  };
}
function isDecoratedAnonymousClassExpression(path) {
  return path.isClassExpression({
    id: null
  }) && shouldTransformClass(path.node);
}
function generateLetUidIdentifier(scope, name) {
  const id = scope.generateUidIdentifier(name);
  scope.push({
    id,
    kind: "let"
  });
  return _core.types.cloneNode(id);
}
function _default({
  assertVersion,
  assumption
}, {
  loose
}, version, inherits) {
  var _assumption, _assumption2;
  {
    if (version === "2023-11" || version === "2023-05" || version === "2023-01") {
      assertVersion("^7.21.0");
    } else if (version === "2021-12") {
      assertVersion("^7.16.0");
    } else {
      assertVersion("^7.19.0");
    }
  }
  const VISITED = new WeakSet();
  const constantSuper = (_assumption = assumption("constantSuper")) != null ? _assumption : loose;
  const ignoreFunctionLength = (_assumption2 = assumption("ignoreFunctionLength")) != null ? _assumption2 : loose;
  const namedEvaluationVisitor = buildNamedEvaluationVisitor(isDecoratedAnonymousClassExpression, visitClass);
  function visitClass(path, state, className) {
    var _node$id;
    if (VISITED.has(path)) return;
    const {
      node
    } = path;
    className != null ? className : className = (_node$id = node.id) == null ? void 0 : _node$id.name;
    const newPath = transformClass(path, state, constantSuper, ignoreFunctionLength, className, namedEvaluationVisitor, version);
    if (newPath) {
      VISITED.add(newPath);
      return;
    }
    VISITED.add(path);
  }
  return {
    name: "proposal-decorators",
    inherits: inherits,
    visitor: Object.assign({
      ExportDefaultDeclaration(path, state) {
        const {
          declaration
        } = path.node;
        if ((declaration == null ? void 0 : declaration.type) === "ClassDeclaration" && isDecorated(declaration)) {
          const isAnonymous = !declaration.id;
          {
            var _path$splitExportDecl;
            (_path$splitExportDecl = path.splitExportDeclaration) != null ? _path$splitExportDecl : path.splitExportDeclaration = require("@babel/traverse").NodePath.prototype.splitExportDeclaration;
          }
          const updatedVarDeclarationPath = path.splitExportDeclaration();
          if (isAnonymous) {
            visitClass(updatedVarDeclarationPath, state, _core.types.stringLiteral("default"));
          }
        }
      },
      ExportNamedDeclaration(path) {
        const {
          declaration
        } = path.node;
        if ((declaration == null ? void 0 : declaration.type) === "ClassDeclaration" && isDecorated(declaration)) {
          {
            var _path$splitExportDecl2;
            (_path$splitExportDecl2 = path.splitExportDeclaration) != null ? _path$splitExportDecl2 : path.splitExportDeclaration = require("@babel/traverse").NodePath.prototype.splitExportDeclaration;
          }
          path.splitExportDeclaration();
        }
      },
      Class(path, state) {
        visitClass(path, state, undefined);
      }
    }, namedEvaluationVisitor)
  };
}

//# sourceMappingURL=decorators.js.map

}, function(modId) { var map = {"./fields.js":1757467947482,"./misc.js":1757467947485}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1757467947485, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractComputedKeys = extractComputedKeys;
exports.injectInitialization = injectInitialization;
exports.memoiseComputedKey = memoiseComputedKey;
var _core = require("@babel/core");
var _traverse = require("@babel/traverse");
const findBareSupers = _traverse.visitors.environmentVisitor({
  Super(path) {
    const {
      node,
      parentPath
    } = path;
    if (parentPath.isCallExpression({
      callee: node
    })) {
      this.push(parentPath);
    }
  }
});
const referenceVisitor = {
  "TSTypeAnnotation|TypeAnnotation"(path) {
    path.skip();
  },
  ReferencedIdentifier(path, {
    scope
  }) {
    if (scope.hasOwnBinding(path.node.name)) {
      scope.rename(path.node.name);
      path.skip();
    }
  }
};
function handleClassTDZ(path, state) {
  if (state.classBinding && state.classBinding === path.scope.getBinding(path.node.name)) {
    const classNameTDZError = state.file.addHelper("classNameTDZError");
    const throwNode = _core.types.callExpression(classNameTDZError, [_core.types.stringLiteral(path.node.name)]);
    path.replaceWith(_core.types.sequenceExpression([throwNode, path.node]));
    path.skip();
  }
}
const classFieldDefinitionEvaluationTDZVisitor = {
  ReferencedIdentifier: handleClassTDZ,
  "TSTypeAnnotation|TypeAnnotation"(path) {
    path.skip();
  }
};
function injectInitialization(path, constructor, nodes, renamer, lastReturnsThis) {
  if (!nodes.length) return;
  const isDerived = !!path.node.superClass;
  if (!constructor) {
    const newConstructor = _core.types.classMethod("constructor", _core.types.identifier("constructor"), [], _core.types.blockStatement([]));
    if (isDerived) {
      newConstructor.params = [_core.types.restElement(_core.types.identifier("args"))];
      newConstructor.body.body.push(_core.template.statement.ast`super(...args)`);
    }
    [constructor] = path.get("body").unshiftContainer("body", newConstructor);
  }
  if (renamer) {
    renamer(referenceVisitor, {
      scope: constructor.scope
    });
  }
  if (isDerived) {
    const bareSupers = [];
    constructor.traverse(findBareSupers, bareSupers);
    let isFirst = true;
    for (const bareSuper of bareSupers) {
      if (isFirst) {
        isFirst = false;
      } else {
        nodes = nodes.map(n => _core.types.cloneNode(n));
      }
      if (!bareSuper.parentPath.isExpressionStatement()) {
        const allNodes = [bareSuper.node, ...nodes.map(n => _core.types.toExpression(n))];
        if (!lastReturnsThis) allNodes.push(_core.types.thisExpression());
        bareSuper.replaceWith(_core.types.sequenceExpression(allNodes));
      } else {
        bareSuper.insertAfter(nodes);
      }
    }
  } else {
    constructor.get("body").unshiftContainer("body", nodes);
  }
}
function memoiseComputedKey(keyNode, scope, hint) {
  const isUidReference = _core.types.isIdentifier(keyNode) && scope.hasUid(keyNode.name);
  if (isUidReference) {
    return;
  }
  const isMemoiseAssignment = _core.types.isAssignmentExpression(keyNode, {
    operator: "="
  }) && _core.types.isIdentifier(keyNode.left) && scope.hasUid(keyNode.left.name);
  if (isMemoiseAssignment) {
    return _core.types.cloneNode(keyNode);
  } else {
    const ident = _core.types.identifier(hint);
    scope.push({
      id: ident,
      kind: "let"
    });
    return _core.types.assignmentExpression("=", _core.types.cloneNode(ident), keyNode);
  }
}
function extractComputedKeys(path, computedPaths, file) {
  const {
    scope
  } = path;
  const declarations = [];
  const state = {
    classBinding: path.node.id && scope.getBinding(path.node.id.name),
    file
  };
  for (const computedPath of computedPaths) {
    const computedKey = computedPath.get("key");
    if (computedKey.isReferencedIdentifier()) {
      handleClassTDZ(computedKey, state);
    } else {
      computedKey.traverse(classFieldDefinitionEvaluationTDZVisitor, state);
    }
    const computedNode = computedPath.node;
    if (!computedKey.isConstantExpression()) {
      const assignment = memoiseComputedKey(computedKey.node, scope, scope.generateUidBasedOnNode(computedKey.node));
      if (assignment) {
        declarations.push(_core.types.expressionStatement(assignment));
        computedNode.key = _core.types.cloneNode(assignment.left);
      }
    }
  }
  return declarations;
}

//# sourceMappingURL=misc.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1757467947486, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildDecoratedClass = buildDecoratedClass;
var _core = require("@babel/core");
var _helperReplaceSupers = require("@babel/helper-replace-supers");
;
function prop(key, value) {
  if (!value) return null;
  return _core.types.objectProperty(_core.types.identifier(key), value);
}
function method(key, body) {
  return _core.types.objectMethod("method", _core.types.identifier(key), [], _core.types.blockStatement(body));
}
function takeDecorators(node) {
  let result;
  if (node.decorators && node.decorators.length > 0) {
    result = _core.types.arrayExpression(node.decorators.map(decorator => decorator.expression));
  }
  node.decorators = undefined;
  return result;
}
function getKey(node) {
  if (node.computed) {
    return node.key;
  } else if (_core.types.isIdentifier(node.key)) {
    return _core.types.stringLiteral(node.key.name);
  } else {
    return _core.types.stringLiteral(String(node.key.value));
  }
}
function extractElementDescriptor(file, classRef, superRef, path) {
  const isMethod = path.isClassMethod();
  if (path.isPrivate()) {
    throw path.buildCodeFrameError(`Private ${isMethod ? "methods" : "fields"} in decorated classes are not supported yet.`);
  }
  if (path.node.type === "ClassAccessorProperty") {
    throw path.buildCodeFrameError(`Accessor properties are not supported in 2018-09 decorator transform, please specify { "version": "2021-12" } instead.`);
  }
  if (path.node.type === "StaticBlock") {
    throw path.buildCodeFrameError(`Static blocks are not supported in 2018-09 decorator transform, please specify { "version": "2021-12" } instead.`);
  }
  const {
    node,
    scope
  } = path;
  if (!path.isTSDeclareMethod()) {
    new _helperReplaceSupers.default({
      methodPath: path,
      objectRef: classRef,
      superRef,
      file,
      refToPreserve: classRef
    }).replace();
  }
  const properties = [prop("kind", _core.types.stringLiteral(_core.types.isClassMethod(node) ? node.kind : "field")), prop("decorators", takeDecorators(node)), prop("static", node.static && _core.types.booleanLiteral(true)), prop("key", getKey(node))].filter(Boolean);
  if (isMethod) {
    {
      var _path$ensureFunctionN;
      (_path$ensureFunctionN = path.ensureFunctionName) != null ? _path$ensureFunctionN : path.ensureFunctionName = require("@babel/traverse").NodePath.prototype.ensureFunctionName;
    }
    path.ensureFunctionName(false);
    properties.push(prop("value", _core.types.toExpression(path.node)));
  } else if (_core.types.isClassProperty(node) && node.value) {
    properties.push(method("value", _core.template.statements.ast`return ${node.value}`));
  } else {
    properties.push(prop("value", scope.buildUndefinedNode()));
  }
  path.remove();
  return _core.types.objectExpression(properties);
}
function addDecorateHelper(file) {
  return file.addHelper("decorate");
}
function buildDecoratedClass(ref, path, elements, file) {
  const {
    node,
    scope
  } = path;
  const initializeId = scope.generateUidIdentifier("initialize");
  const isDeclaration = node.id && path.isDeclaration();
  const isStrict = path.isInStrictMode();
  const {
    superClass
  } = node;
  node.type = "ClassDeclaration";
  if (!node.id) node.id = _core.types.cloneNode(ref);
  let superId;
  if (superClass) {
    superId = scope.generateUidIdentifierBasedOnNode(node.superClass, "super");
    node.superClass = superId;
  }
  const classDecorators = takeDecorators(node);
  const definitions = _core.types.arrayExpression(elements.filter(element => !element.node.abstract && element.node.type !== "TSIndexSignature").map(path => extractElementDescriptor(file, node.id, superId, path)));
  const wrapperCall = _core.template.expression.ast`
    ${addDecorateHelper(file)}(
      ${classDecorators || _core.types.nullLiteral()},
      function (${initializeId}, ${superClass ? _core.types.cloneNode(superId) : null}) {
        ${node}
        return { F: ${_core.types.cloneNode(node.id)}, d: ${definitions} };
      },
      ${superClass}
    )
  `;
  if (!isStrict) {
    wrapperCall.arguments[1].body.directives.push(_core.types.directive(_core.types.directiveLiteral("use strict")));
  }
  let replacement = wrapperCall;
  let classPathDesc = "arguments.1.body.body.0";
  if (isDeclaration) {
    replacement = _core.template.statement.ast`let ${ref} = ${wrapperCall}`;
    classPathDesc = "declarations.0.init." + classPathDesc;
  }
  return {
    instanceNodes: [_core.template.statement.ast`
        ${_core.types.cloneNode(initializeId)}(this)
      `],
    wrapClass(path) {
      path.replaceWith(replacement);
      return path.get(classPathDesc);
    }
  };
}

//# sourceMappingURL=decorators-2018-09.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1757467947487, function(require, module, exports) {


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FEATURES = void 0;
exports.enableFeature = enableFeature;
exports.isLoose = isLoose;
exports.shouldTransform = shouldTransform;
var _decorators = require("./decorators.js");
const FEATURES = exports.FEATURES = Object.freeze({
  fields: 1 << 1,
  privateMethods: 1 << 2,
  decorators: 1 << 3,
  privateIn: 1 << 4,
  staticBlocks: 1 << 5
});
const featuresSameLoose = new Map([[FEATURES.fields, "@babel/plugin-transform-class-properties"], [FEATURES.privateMethods, "@babel/plugin-transform-private-methods"], [FEATURES.privateIn, "@babel/plugin-transform-private-property-in-object"]]);
const featuresKey = "@babel/plugin-class-features/featuresKey";
const looseKey = "@babel/plugin-class-features/looseKey";
{
  var looseLowPriorityKey = "@babel/plugin-class-features/looseLowPriorityKey/#__internal__@babel/preset-env__please-overwrite-loose-instead-of-throwing";
}
{
  var canIgnoreLoose = function (file, feature) {
    return !!(file.get(looseLowPriorityKey) & feature);
  };
}
function enableFeature(file, feature, loose) {
  if (!hasFeature(file, feature) || canIgnoreLoose(file, feature)) {
    file.set(featuresKey, file.get(featuresKey) | feature);
    if (loose === "#__internal__@babel/preset-env__prefer-true-but-false-is-ok-if-it-prevents-an-error") {
      setLoose(file, feature, true);
      file.set(looseLowPriorityKey, file.get(looseLowPriorityKey) | feature);
    } else if (loose === "#__internal__@babel/preset-env__prefer-false-but-true-is-ok-if-it-prevents-an-error") {
      setLoose(file, feature, false);
      file.set(looseLowPriorityKey, file.get(looseLowPriorityKey) | feature);
    } else {
      setLoose(file, feature, loose);
    }
  }
  let resolvedLoose;
  for (const [mask, name] of featuresSameLoose) {
    if (!hasFeature(file, mask)) continue;
    {
      if (canIgnoreLoose(file, mask)) continue;
    }
    const loose = isLoose(file, mask);
    if (resolvedLoose === !loose) {
      throw new Error("'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, " + "@babel/plugin-transform-private-methods and " + "@babel/plugin-transform-private-property-in-object (when they are enabled)." + "\n\n" + getBabelShowConfigForHint(file));
    } else {
      resolvedLoose = loose;
      {
        var higherPriorityPluginName = name;
      }
    }
  }
  if (resolvedLoose !== undefined) {
    for (const [mask, name] of featuresSameLoose) {
      if (hasFeature(file, mask) && isLoose(file, mask) !== resolvedLoose) {
        setLoose(file, mask, resolvedLoose);
        console.warn(`Though the "loose" option was set to "${!resolvedLoose}" in your @babel/preset-env ` + `config, it will not be used for ${name} since the "loose" mode option was set to ` + `"${resolvedLoose}" for ${higherPriorityPluginName}.\nThe "loose" option must be the ` + `same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods ` + `and @babel/plugin-transform-private-property-in-object (when they are enabled): you can ` + `silence this warning by explicitly adding\n` + `\t["${name}", { "loose": ${resolvedLoose} }]\n` + `to the "plugins" section of your Babel config.` + "\n\n" + getBabelShowConfigForHint(file));
      }
    }
  }
}
function getBabelShowConfigForHint(file) {
  let {
    filename
  } = file.opts;
  if (!filename || filename === "unknown") {
    filename = "[name of the input file]";
  }
  return `\
If you already set the same 'loose' mode for these plugins in your config, it's possible that they \
are enabled multiple times with different options.
You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded \
configuration:
\tnpx cross-env BABEL_SHOW_CONFIG_FOR=${filename} <your build command>
See https://babeljs.io/docs/configuration#print-effective-configs for more info.`;
}
function hasFeature(file, feature) {
  return !!(file.get(featuresKey) & feature);
}
function isLoose(file, feature) {
  return !!(file.get(looseKey) & feature);
}
function setLoose(file, feature, loose) {
  if (loose) file.set(looseKey, file.get(looseKey) | feature);else file.set(looseKey, file.get(looseKey) & ~feature);
  {
    file.set(looseLowPriorityKey, file.get(looseLowPriorityKey) & ~feature);
  }
}
function shouldTransform(path, file) {
  let decoratorPath = null;
  let publicFieldPath = null;
  let privateFieldPath = null;
  let privateMethodPath = null;
  let staticBlockPath = null;
  if ((0, _decorators.hasOwnDecorators)(path.node)) {
    decoratorPath = path.get("decorators.0");
  }
  for (const el of path.get("body.body")) {
    if (!decoratorPath && (0, _decorators.hasOwnDecorators)(el.node)) {
      decoratorPath = el.get("decorators.0");
    }
    if (!publicFieldPath && el.isClassProperty()) {
      publicFieldPath = el;
    }
    if (!privateFieldPath && el.isClassPrivateProperty()) {
      privateFieldPath = el;
    }
    if (!privateMethodPath && el.isClassPrivateMethod != null && el.isClassPrivateMethod()) {
      privateMethodPath = el;
    }
    if (!staticBlockPath && el.isStaticBlock != null && el.isStaticBlock()) {
      staticBlockPath = el;
    }
  }
  if (decoratorPath && privateFieldPath) {
    throw privateFieldPath.buildCodeFrameError("Private fields in decorated classes are not supported yet.");
  }
  if (decoratorPath && privateMethodPath) {
    throw privateMethodPath.buildCodeFrameError("Private methods in decorated classes are not supported yet.");
  }
  if (decoratorPath && !hasFeature(file, FEATURES.decorators)) {
    throw path.buildCodeFrameError("Decorators are not enabled." + "\nIf you are using " + '["@babel/plugin-proposal-decorators", { "version": "legacy" }], ' + 'make sure it comes *before* "@babel/plugin-transform-class-properties" ' + "and enable loose mode, like so:\n" + '\t["@babel/plugin-proposal-decorators", { "version": "legacy" }]\n' + '\t["@babel/plugin-transform-class-properties", { "loose": true }]');
  }
  if (privateMethodPath && !hasFeature(file, FEATURES.privateMethods)) {
    throw privateMethodPath.buildCodeFrameError("Class private methods are not enabled. " + "Please add `@babel/plugin-transform-private-methods` to your configuration.");
  }
  if ((publicFieldPath || privateFieldPath) && !hasFeature(file, FEATURES.fields) && !hasFeature(file, FEATURES.privateMethods)) {
    throw path.buildCodeFrameError("Class fields are not enabled. " + "Please add `@babel/plugin-transform-class-properties` to your configuration.");
  }
  if (staticBlockPath && !hasFeature(file, FEATURES.staticBlocks)) {
    throw path.buildCodeFrameError("Static class blocks are not enabled. " + "Please add `@babel/plugin-transform-class-static-block` to your configuration.");
  }
  if (decoratorPath || privateMethodPath || staticBlockPath) {
    return true;
  }
  if ((publicFieldPath || privateFieldPath) && hasFeature(file, FEATURES.fields)) {
    return true;
  }
  return false;
}

//# sourceMappingURL=features.js.map

}, function(modId) { var map = {"./decorators.js":1757467947484}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1757467947481);
})()
//miniprogram-npm-outsideDeps=["@babel/core","semver","@babel/traverse","@babel/helper-replace-supers","@babel/helper-member-expression-to-functions","@babel/helper-optimise-call-expression","@babel/helper-annotate-as-pure","@babel/helper-skip-transparent-expression-wrappers"]
//# sourceMappingURL=index.js.map