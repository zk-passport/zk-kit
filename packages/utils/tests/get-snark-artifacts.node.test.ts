import { createWriteStream, existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { getEddsaSnarkArtifacts, getPoseidonSnarkArtifacts } from "../src/get-snark-artifacts/get-snark-artifacts.node"

jest.mock("node:fs", () => ({
    ...jest.requireActual("node:fs"),
    createWriteStream: jest.fn(),
    existsSync: jest.fn()
}))

jest.mock("node:fs/promises", () => ({
    ...jest.requireActual("node:fs/promises"),
    mkdir: jest.fn()
}))

global.fetch = jest.fn()

beforeEach(() => {
    jest.resetAllMocks()
    ;(mkdir as jest.Mock).mockResolvedValue(undefined)
})

describe("getPoseidonSnarkArtifacts", () => {
    it("should throw on fetch errors", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: "TEST"
        })
        await expect(getPoseidonSnarkArtifacts(2)).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Failed to fetch https://zkkit.cedoor.dev/poseidon-proof/artifacts/2/poseidon-proof.wasm: TEST"`
        )
    })

    it("should throw on invalid numberOfInputs", async () => {
        await expect(getPoseidonSnarkArtifacts(0)).rejects.toThrowErrorMatchingInlineSnapshot(
            `"numberOfInputs must be greater than 0"`
        )
    })

    it("should throw if missing body", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            statusText: "OK"
        })
        await expect(getPoseidonSnarkArtifacts(2)).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Failed to get response body"`
        )
    })

    it("should throw on stream error", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        const mockResponseStream = {
            body: {
                getReader: jest.fn(() => ({
                    read: jest.fn().mockRejectedValueOnce(new Error("TEST STREAM ERROR"))
                }))
            },
            ok: true,
            statusText: "OK"
        }
        ;(global.fetch as jest.Mock).mockResolvedValue(mockResponseStream)
        ;(createWriteStream as jest.Mock).mockReturnValue({
            close: jest.fn(),
            end: jest.fn(),
            write: jest.fn()
        })
        await expect(getPoseidonSnarkArtifacts(2)).rejects.toThrowErrorMatchingInlineSnapshot(`"TEST STREAM ERROR"`)
    })

    it("should download files only if don't exist yet", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(true)
        await getPoseidonSnarkArtifacts(2)
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it("should return artifact filePaths", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        const mockResponseStream = {
            body: {
                getReader: jest.fn(() => ({
                    read: jest
                        .fn()
                        .mockResolvedValueOnce({ done: false, value: "test data" })
                        .mockResolvedValueOnce({ done: true })
                }))
            },
            ok: true,
            statusText: "OK"
        }
        ;(global.fetch as jest.Mock).mockResolvedValue(mockResponseStream)
        ;(createWriteStream as jest.Mock).mockReturnValue({
            close: jest.fn(),
            end: jest.fn(),
            write: jest.fn()
        })
        await expect(getPoseidonSnarkArtifacts(2)).resolves.toMatchInlineSnapshot(`
            {
              "wasmFilePath": "/tmp/poseidon-proof-2/poseidon-proof.wasm",
              "zkeyFilePath": "/tmp/poseidon-proof-2/poseidon-proof.zkey",
            }
        `)

        expect(existsSync).toHaveBeenCalledTimes(2)
        expect(mkdir).toHaveBeenCalledTimes(2)
        expect(global.fetch).toHaveBeenCalledTimes(2)
        expect(mockResponseStream.body.getReader).toHaveBeenCalledTimes(2)
        expect(createWriteStream).toHaveBeenCalledTimes(2)
    })
})

describe("getEddsaSnarkArtifacts", () => {
    it("should handle fetch errors", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: "TEST"
        })
        await expect(getEddsaSnarkArtifacts()).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Failed to fetch https://zkkit.cedoor.dev/eddsa-proof/eddsa-proof.wasm: TEST"`
        )
    })

    it("should throw if missing body", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            statusText: "OK"
        })
        await expect(getEddsaSnarkArtifacts()).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Failed to get response body"`
        )
    })

    it("should download files only if don't exist yet", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(true)
        await getPoseidonSnarkArtifacts(2)
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it("should return artifact filePaths", async () => {
        ;(existsSync as jest.Mock).mockReturnValue(false)
        const mockResponseStream = {
            body: {
                getReader: jest.fn(() => ({
                    read: jest
                        .fn()
                        .mockResolvedValueOnce({ done: false, value: "test data" })
                        .mockResolvedValueOnce({ done: true })
                }))
            },
            ok: true,
            statusText: "OK"
        }
        ;(global.fetch as jest.Mock).mockResolvedValue(mockResponseStream)
        ;(createWriteStream as jest.Mock).mockReturnValue({
            close: jest.fn(),
            end: jest.fn(),
            write: jest.fn()
        })
        await expect(getEddsaSnarkArtifacts()).resolves.toMatchInlineSnapshot(`
            {
              "wasmFilePath": "/tmp/eddsa-proof/eddsa-proof.wasm",
              "zkeyFilePath": "/tmp/eddsa-proof/eddsa-proof.zkey",
            }
        `)

        expect(existsSync).toHaveBeenCalledTimes(2)
        expect(mkdir).toHaveBeenCalledTimes(2)
        expect(global.fetch).toHaveBeenCalledTimes(2)
        expect(mockResponseStream.body.getReader).toHaveBeenCalledTimes(2)
        expect(createWriteStream).toHaveBeenCalledTimes(2)
    })
})
