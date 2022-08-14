import React, { useContext, useEffect, useMemo, useState } from "react";
import { useEndpoint } from "@strata-foundation/react";

type CodeExec = (vars: any) => Promise<void>;
interface IVariablesContext {
  variables: any;
  setVariables: React.Dispatch<any>;
  register: (name: string, deps: string[], exec: CodeExec) => void;
  execWithDeps: (name: string) => Promise<void>;
}
export const VariablesContext = React.createContext<IVariablesContext>({
  variables: null,
  setVariables: (i: any) => null,
  register: () => null,
  execWithDeps: () => Promise.resolve(),
});

//@ts-ignore
export const VariablesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [variables, setVariables] = useState<any>(null);
  const [dependencies, setDependencies] = useState<
    Record<string, { deps: string[]; exec: CodeExec }>
  >({});
  const [executed, setExecuted] = useState<Set<string>>(new Set());

  const register = (name: string, deps: string[], exec: CodeExec) => {
    setDependencies((d) => ({
      ...d,
      [name]: { deps, exec },
    }));
  };

  const execWithDeps = useMemo(
    () =>
      async (name: string, vars: any = variables): Promise<any> => {
        for (const dep of dependencies[name].deps) {
          if (!executed.has(dep)) {
            vars = { ...vars, ...(await execWithDeps(dep, vars)) };
          }
        }

        const ret = await dependencies[name].exec(vars);
        setExecuted((e) => {
          e.add(name);
          return e;
        });
        setVariables(ret);
        return ret;
      },
    [dependencies, setVariables, variables]
  );

  const { cluster } = useEndpoint();
  useEffect(() => {
    setVariables(vars => ({
      ...vars,
      cluster
    }))
  }, [cluster])

  return (
    <VariablesContext.Provider
      value={{ variables, setVariables, register, execWithDeps }}
    >
      {children}
    </VariablesContext.Provider>
  );
};

export const useVariablesContext = () => {
  return useContext(VariablesContext);
};

export const useVariables = () => {
  return useVariablesContext().variables || {};
};
